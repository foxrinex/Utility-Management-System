const Forum = require('../models/forum');
const ForumReply = require('../models/forumReply');
const Outage = require('../models/outage');

// --- 1. GET ALL FORUM POSTS (WITH REPLIES ATTACHED) ---
const getAllForumPosts = async (req, res) => {
  try {
    // Populate pulls linked outage details if it exists
    const posts = await Forum.find({}).populate('outageId').sort({ createdAt: -1 });

    // Convert mongoose objects to plain JavaScript objects to attach replies manually
    const postsWithReplies = [];

    for (let i = 0; i < posts.length; i++) {
      const currentPost = posts[i].toObject();
      
      // Explicitly query all replies pointing to this post ID from the reply collection
      const replies = await ForumReply.find({ postId: currentPost._id }).sort({ createdAt: 1 });
      
      currentPost.answers = replies;
      postsWithReplies.push(currentPost);
    }

    return res.status(200).json(postsWithReplies);
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return res.status(500).json({ error: 'Internal server error while fetching forum data.' });
  }
};


// --- 2. CREATE A FORUM POST ---
const createForumPost = async (req, res) => {
  try {
    const { title, category, questionContent, askedById, askedByName, outageId } = req.body;

    if (!title || !category || !questionContent || !askedById || !askedByName) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    let validatedOutageId = null;
    if (outageId && outageId !== '') {
      validatedOutageId = outageId;
    }

    const newPost = new Forum({
      title: title,
      category: category,
      questionContent: questionContent,
      askedById: askedById,
      askedByName: askedByName,
      outageId: validatedOutageId
    });

    await newPost.save();

    // Attach an empty answers list structure so the frontend gets a predictable format
    const responsePayload = newPost.toObject();
    responsePayload.answers = [];

    return res.status(201).json({ message: 'Forum post created successfully.', post: responsePayload });
  } catch (error) {
    console.error('Error creating forum post:', error);
    return res.status(500).json({ error: 'Internal server error while creating forum post.' });
  }
};


// --- 3. SUBMIT AN ANSWER TO A POST ---
const answerForumPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { authorId, authorName, content } = req.body;

    if (!authorId || !authorName || !content) {
      return res.status(400).json({ error: 'Answer fields cannot be empty.' });
    }

    const targetPost = await Forum.findById(postId);
    if (!targetPost) {
      return res.status(404).json({ error: 'Target forum post not found.' });
    }

    const newReply = new ForumReply({
      postId: postId,
      authorId: authorId,
      authorName: authorName,
      content: content
    });

    await newReply.save();

    return res.status(201).json({ message: 'Answer posted successfully.', reply: newReply });
  } catch (error) {
    console.error('Error submitting forum answer:', error);
    return res.status(500).json({ error: 'Internal server error while posting answer.' });
  }
};


// --- 4. UPDATE AN EXISTING FORUM POST ---
const updateForumPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, category, questionContent, outageId } = req.body;

    const targetPost = await Forum.findById(postId);
    if (!targetPost) {
      return res.status(404).json({ error: 'Forum post not found.' });
    }

    if (title) targetPost.title = title;
    if (category) targetPost.category = category;
    if (questionContent) targetPost.questionContent = questionContent;
    
    if (outageId !== undefined) {
      targetPost.outageId = outageId === '' ? null : outageId;
    }

    await targetPost.save();

    return res.status(200).json({ message: 'Forum post updated successfully.', post: targetPost });
  } catch (error) {
    console.error('Error updating forum post:', error);
    return res.status(500).json({ error: 'Internal server error while updating forum post.' });
  }
};


// --- 5. DELETE AN ENTIRE FORUM POST (AND ALL ITS REPLIES) ---
const deleteForumPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const deletedPost = await Forum.findByIdAndDelete(postId);
    if (!deletedPost) {
      return res.status(404).json({ error: 'Forum post not found.' });
    }

    // Explicitly delete all separate reply records tied to this parent postId
    await ForumReply.deleteMany({ postId: postId });

    return res.status(200).json({ message: 'Forum post and associated replies deleted successfully.' });
  } catch (error) {
    console.error('Error deleting forum post:', error);
    return res.status(500).json({ error: 'Internal server error while deleting forum post.' });
  }
};


// --- 6. UPDATE A SPECIFIC REPLY RECONSTRUCTED FOR SEPARATE TABLE ---
const updateForumReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Updated reply content cannot be empty.' });
    }

    const targetReply = await ForumReply.findById(replyId);
    if (!targetReply) {
      return res.status(404).json({ error: 'Target reply statement not found.' });
    }

    targetReply.content = content;
    await targetReply.save();

    return res.status(200).json({ message: 'Reply updated successfully.', reply: targetReply });
  } catch (error) {
    console.error('Error updating forum reply:', error);
    return res.status(500).json({ error: 'Internal server error modifying reply row.' });
  }
};


// --- 7. DELETE A SPECIFIC REPLY FROM SEPARATE TABLE ---
const deleteForumReply = async (req, res) => {
  try {
    const { replyId } = req.params;

    const deletedReply = await ForumReply.findByIdAndDelete(replyId);
    if (!deletedReply) {
      return res.status(404).json({ error: 'Target reply item already removed or missing.' });
    }

    return res.status(200).json({ message: 'Reply removed successfully.' });
  } catch (error) {
    console.error('Error deleting forum reply:', error);
    return res.status(500).json({ error: 'Internal server error dropping reply reference.' });
  }
};


module.exports = {
  getAllForumPosts,
  createForumPost,
  answerForumPost,
  updateForumPost,
  deleteForumPost,
  updateForumReply,
  deleteForumReply
};