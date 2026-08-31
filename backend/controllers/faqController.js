const Faq = require('../models/Faq');
const Category = require('../models/Category');

// --- FAQ CONTROLLERS ---

// Get all FAQs
exports.getAllFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ createdAt: -1 });

    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching FAQs', error: error.message });
  }
};

// Create a new FAQ
exports.createFaq = async (req, res) => {
  try {
    const { question, answer, category } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required.' });
    }

    const newFaq = new Faq({
      question: question,
      answer: answer,
      category: category || 'General',
    });

    await newFaq.save();

    res.status(201).json(newFaq);
  } catch (error) {
    res.status(500).json({ message: 'Error creating FAQ', error: error.message });
  }
};

// Update an existing FAQ
exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category } = req.body;

    const updatedFaq = await Faq.findByIdAndUpdate(
      id,
      { question: question, answer: answer, category: category },
      { new: true }
    );

    if (!updatedFaq) {
      return res.status(404).json({ message: 'FAQ not found.' });
    }

    res.status(200).json(updatedFaq);
  } catch (error) {
    res.status(500).json({ message: 'Error updating FAQ', error: error.message });
  }
};

// Delete an FAQ
exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFaq = await Faq.findByIdAndDelete(id);

    if (!deletedFaq) {
      return res.status(404).json({ message: 'FAQ not found.' });
    }

    res.status(200).json({ message: 'FAQ deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting FAQ', error: error.message });
  }
};

// --- CATEGORY CONTROLLERS ---

// Get all categories (seeds default ones if database is empty)
exports.getAllCategories = async (req, res) => {
  try {
    let categories = await Category.find().sort({ name: 1 });

    // Seed default categories if none exist yet
    if (categories.length === 0) {
      const defaults = ['General', 'Outages', 'Billing', 'Safety'];

      for (let i = 0; i < defaults.length; i++) {
        const cat = new Category({ name: defaults[i] });
        await cat.save();
      }

      categories = await Category.find().sort({ name: 1 });
    }

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const existingCategory = await Category.findOne({ name: name.trim() });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists.' });
    }

    const newCategory = new Category({ name: name.trim() });

    await newCategory.save();

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};