import React from 'react';

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  ASSIGNED: '#0ea5e9',
  ON_WAY: '#fb923c',
  ON_SITE: '#a855f7',
  RESOLVED: '#22c55e',
  REPORTED: '#f59e0b',
};

export function TechForum({
  user,
  tasks = [],
  forumPosts = [],
  forumTitle, setForumTitle,
  forumCategory, setForumCategory,
  forumContent, setForumContent,
  forumOutageId, setForumOutageId,
  replyContent, setReplyContent,
  editingPostId, setEditingPostId,
  editPostTitle, setEditPostTitle,
  editPostCategory, setEditPostCategory,
  editPostContent, setEditPostContent,
  editPostOutageId, setEditPostOutageId,
  editingReplyId, setEditingReplyId,
  editReplyContent, setEditReplyContent,
  handleCreateForumPost,
  handleUpdateForumPost,
  handleDeleteForumPost,
  handleCreateReply,
  handleUpdateReply,
  handleDeleteReply
}) {

  const currentUserId = user?.id || user?._id;

  // Unroll task dropdown selection options for creating a post
  const taskOptions = [];
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    taskOptions.push(
      <option key={t._id} value={t._id}>
        [{t.utilityType}] {t.locationName} - {t.status}
      </option>
    );
  }

  // Unroll task dropdown selection options inside the inline post editor
  const editTaskOptions = [];
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    editTaskOptions.push(
      <option key={t._id} value={t._id}>
        [{t.utilityType}] {t.locationName}
      </option>
    );
  }

  // Process and build the main forum thread feed
  const renderedForumPosts = [];
  for (let i = 0; i < forumPosts.length; i++) {
    const post = forumPosts[i];

    // Process and build sub-collection array of replies for this specific post
    const renderedReplies = [];
    if (post.answers) {
      for (let j = 0; j < post.answers.length; j++) {
        const reply = post.answers[j];

        renderedReplies.push(
          <div key={reply._id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-900 text-xs space-y-1">
            
            {editingReplyId === reply._id ? (
              <div className="space-y-2">
                <textarea 
                  value={editReplyContent}
                  onChange={(e) => setEditReplyContent(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateReply(reply._id)}
                    className="px-2 py-0.5 bg-green-700 text-[10px] font-bold rounded"
                  >
                    SAVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingReplyId(null)}
                    className="px-2 py-0.5 bg-slate-800 text-[10px] font-bold rounded"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 font-bold">
                    {reply.authorName}{' '}
                    <span className="text-[9px] font-normal text-slate-600">
                      ({new Date(reply.createdAt).toLocaleDateString()})
                    </span>
                  </span>
                  {reply.authorId === currentUserId && (
                    <div className="flex gap-2 text-[9px]">
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingReplyId(reply._id);
                          setEditReplyContent(reply.content);
                        }} 
                        className="text-amber-500 hover:underline"
                      >
                        EDIT
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteReply(reply._id)} 
                        className="text-red-400 hover:underline"
                      >
                        DELETE
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-slate-300 whitespace-pre-wrap">{reply.content}</p>
              </div>
            )}

          </div>
        );
      }
    }

    // Push standard post container combining dynamic parameters and sub-loops
    renderedForumPosts.push(
      <div key={post._id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        
        {editingPostId === post._id ? (
          <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black text-amber-500 uppercase">Modify Topic Properties</p>
            <input 
              type="text"
              value={editPostTitle}
              onChange={(e) => setEditPostTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
            />
            <select
              value={editPostCategory}
              onChange={(e) => setEditPostCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
            >
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Gas">Gas</option>
            </select>
            <select
              value={editPostOutageId}
              onChange={(e) => setEditPostOutageId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
            >
              <option value="">-- No Linked Incident Outage Reference --</option>
              {editTaskOptions}
            </select>
            <textarea
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              rows="2"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
            />
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => handleUpdateForumPost(post._id)}
                className="px-3 py-1 bg-green-700 text-xs font-bold rounded hover:bg-green-600"
              >
                SAVE MODIFICATIONS
              </button>
              <button 
                type="button"
                onClick={() => setEditingPostId(null)}
                className="px-3 py-1 bg-slate-800 text-xs font-bold rounded hover:bg-slate-700"
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-cyan-400 text-[9px] font-black uppercase tracking-widest bg-cyan-950/40 px-2 py-0.5 border border-cyan-800/40 rounded">
                  {post.category}
                </span>
                <h4 className="text-base font-bold mt-1.5">{post.title}</h4>
              </div>
              
              {post.askedById === currentUserId && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPostId(post._id);
                      setEditPostTitle(post.title);
                      setEditPostCategory(post.category);
                      setEditPostContent(post.questionContent);
                      setEditPostOutageId(post.outageId?._id || post.outageId || '');
                    }}
                    className="text-[10px] text-amber-500 hover:underline bg-slate-900 px-2 py-1 rounded border border-slate-800"
                  >
                    EDIT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteForumPost(post._id)}
                    className="text-[10px] text-red-400 hover:underline bg-slate-900 px-2 py-1 rounded border border-slate-800"
                  >
                    DELETE
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-900 mt-2 whitespace-pre-wrap">
              {post.questionContent}
            </p>

            <div className="flex flex-wrap justify-between items-center text-[10px] text-slate-500 mt-2 pt-1">
              <span>Thread initiated by: <strong className="text-slate-400">{post.askedByName}</strong></span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>

            {post.outageId && (
              <div className="mt-3 p-2.5 bg-cyan-950/20 border border-cyan-900/30 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block">Linked Live Outage Map Incident:</span>
                  <strong className="text-slate-200">{post.outageId.locationName || 'Unknown Location'}</strong>
                  {post.outageId.description && (
                    <span className="text-slate-400 block text-[10px] italic">"{post.outageId.description}"</span>
                  )}
                </div>
                <span 
                  className="text-[9px] font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: (STATUS_COLORS[post.outageId.status] || '#aaa') + '33', color: STATUS_COLORS[post.outageId.status] || '#aaa' }}
                >
                  {post.outageId.status}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="pl-6 border-l-2 border-slate-800 space-y-3">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Responses ({post.answers ? post.answers.length : 0})
          </h5>
          
          {renderedReplies}

          <div className="flex gap-2 mt-2 pt-1">
            <input 
              type="text"
              value={replyContent[post._id] || ''}
              onChange={(e) => setReplyContent({ ...replyContent, [post._id]: e.target.value })}
              placeholder="Provide field insight or troubleshooting advice..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={() => handleCreateReply(post._id)}
              className="px-4 bg-slate-800 hover:bg-cyan-700 hover:text-white border border-slate-700 text-slate-300 text-xs font-bold rounded transition-all"
            >
              SUBMIT
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      
      <form onSubmit={handleCreateForumPost} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider">Ask Fellow Technicians For Help</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Question Summary Title</label>
            <input 
              type="text"
              value={forumTitle}
              onChange={(e) => setForumTitle(e.target.value)}
              placeholder="e.g., Transformer sparking at Section 11"
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Utility Classification Category</label>
            <select
              value={forumCategory}
              onChange={(e) => setForumCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Gas">Gas</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Link to An Active Incident Map Task (Optional)</label>
          <select
            value={forumOutageId}
            onChange={(e) => setForumOutageId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">-- No Linked Incident Outage Reference --</option>
            {taskOptions}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Explain the Issue Faced down in the Field</label>
          <textarea
            value={forumContent}
            onChange={(e) => setForumContent(e.target.value)}
            placeholder="Describe your technical bottleneck or mechanical hardware locking issue..."
            rows="3"
            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-cyan-600 rounded text-xs font-bold hover:bg-cyan-500 transition-all"
        >
          PUBLISH TOPIC UNTO TECHNICAL FORUM
        </button>
      </form>

      <hr className="border-slate-800" />

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Help Board Threads</h3>
        
        {forumPosts.length === 0 && (
          <p className="text-xs text-slate-600 italic">The technician support forum is currently silent.</p>
        )}

        {renderedForumPosts}
      </div>

    </div>
  );
}