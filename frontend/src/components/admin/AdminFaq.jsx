import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000';

function AdminFaq() {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState(null);

  const fetchFaqs = () => {
    fetch(`${API}/api/faqs`)
      .then((res) => res.json())
      .then((data) => setFaqs(data))
      .catch((err) => console.error('FAQ fetch error:', err));
  };

  const fetchCategories = () => {
    fetch(`${API}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0 && !category) {
          setCategory(data[0].name);
        }
      })
      .catch((err) => console.error('Category fetch error:', err));
  };

  useEffect(() => {
    fetchFaqs();
    fetchCategories();
  }, []);

  // Category Actions
  const handleAddCategory = (e) => {
    e.preventDefault();

    if (!newCategoryName.trim()) {
      alert('Please enter a category name.');
      return;
    }

    fetch(`${API}/api/categories/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message && data.message.includes('exists')) {
          alert(data.message);
        } else {
          alert('Category added successfully!');
          setNewCategoryName('');
          fetchCategories();
        }
      })
      .catch((err) => console.error('Category add error:', err));
  };

  const handleDeleteCategory = (id, catName) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;

    fetch(`${API}/api/categories/delete/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => {
        alert('Category deleted.');
        fetchCategories();
      })
      .catch((err) => console.error('Category delete error:', err));
  };

  // FAQ Actions
  const handleSubmitFaq = (e) => {
    e.preventDefault();

    if (!question || !answer) {
      alert('Please fill in both question and answer.');
      return;
    }

    const selectedCat = category || (categories.length > 0 ? categories[0].name : 'General');

    if (editingId) {
      // Update FAQ
      fetch(`${API}/api/faqs/update/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question, answer: answer, category: selectedCat }),
      })
        .then((res) => res.json())
        .then(() => {
          alert('FAQ updated successfully!');
          resetFaqForm();
          fetchFaqs();
        })
        .catch((err) => console.error('FAQ update error:', err));
    } else {
      // Create FAQ
      fetch(`${API}/api/faqs/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question, answer: answer, category: selectedCat }),
      })
        .then((res) => res.json())
        .then(() => {
          alert('FAQ published successfully!');
          resetFaqForm();
          fetchFaqs();
        })
        .catch((err) => console.error('FAQ create error:', err));
    }
  };

  const handleEditFaq = (faqItem) => {
    setEditingId(faqItem._id);
    setQuestion(faqItem.question);
    setAnswer(faqItem.answer);
    setCategory(faqItem.category);
  };

  const handleDeleteFaq = (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

    fetch(`${API}/api/faqs/delete/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => {
        alert('FAQ deleted.');
        fetchFaqs();
      })
      .catch((err) => console.error('FAQ delete error:', err));
  };

  const resetFaqForm = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    if (categories.length > 0) {
      setCategory(categories[0].name);
    }
  };

  // Build category select options using explicit for loop
  const categorySelectOptions = [];
  for (let i = 0; i < categories.length; i++) {
    categorySelectOptions.push(
      <option key={categories[i]._id} value={categories[i].name}>
        {categories[i].name}
      </option>
    );
  }

  // Build category tags/chips using explicit for loop
  const categoryPills = [];
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    categoryPills.push(
      <div
        key={cat._id}
        className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs"
      >
        <span className="text-slate-300 font-bold">{cat.name}</span>
        <button
          type="button"
          onClick={() => handleDeleteCategory(cat._id, cat.name)}
          className="text-red-400 hover:text-red-300 font-black text-xs"
        >
          ×
        </button>
      </div>
    );
  }

  // Build FAQ list items using explicit for loop
  const faqListItems = [];
  for (let i = 0; i < faqs.length; i++) {
    const item = faqs[i];

    faqListItems.push(
      <div key={item._id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-2 py-0.5 rounded-full">
            {item.category}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => handleEditFaq(item)}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              EDIT
            </button>
            <button
              onClick={() => handleDeleteFaq(item._id)}
              className="text-xs text-red-400 hover:underline font-bold"
            >
              DELETE
            </button>
          </div>
        </div>

        <h4 className="text-base font-bold text-white mb-2">{item.question}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{item.answer}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto flex-1">
      {/* Category Manager Section */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
          Manage FAQ Categories
        </h3>

        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New Category Name (e.g. Billing, Outages...)"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-cyan-600 rounded-lg text-xs font-bold hover:bg-cyan-500 transition-all text-white"
          >
            ADD CATEGORY
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {categories.length === 0 && (
            <p className="text-xs text-slate-500 italic">No categories found.</p>
          )}
          {categoryPills}
        </div>
      </div>

      {/* FAQ Form Section */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider mb-4">
          {editingId ? 'Edit FAQ Item' : 'Add New FAQ Item'}
        </h3>

        <form onSubmit={handleSubmitFaq} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {categorySelectOptions}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What should I do if a power line is down?"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Answer</label>
            <textarea
              rows="3"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g., Stay at least 35 feet away and report it immediately..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-cyan-600 rounded-lg text-xs font-bold hover:bg-cyan-500 transition-all text-white"
            >
              {editingId ? 'UPDATE FAQ' : 'PUBLISH FAQ'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetFaqForm}
                className="py-3 px-4 bg-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all"
              >
                CANCEL
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Published FAQ Items */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Published FAQs ({faqs.length})
        </h3>

        {faqs.length === 0 && (
          <p className="text-xs text-slate-500 italic">No FAQ items published yet.</p>
        )}

        {faqListItems}
      </div>
    </div>
  );
}

export default AdminFaq;