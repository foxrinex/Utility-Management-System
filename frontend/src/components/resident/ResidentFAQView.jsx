import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000';

export function ResidentFAQView() {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState(['ALL']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openFaqId, setOpenFaqId] = useState(null);

  const fetchFaqs = () => {
    fetch(`${API}/api/faqs/all`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFaqs(data);
        } else {
          setFaqs([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching FAQs:', err);
        setLoading(false);
      });
  };

  const fetchCategories = () => {
    fetch(`${API}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const categoryList = ['ALL'];
          for (let i = 0; i < data.length; i++) {
            categoryList.push(data[i].name);
          }
          setCategories(categoryList);
        }
      })
      .catch((err) => {
        console.error('Error fetching categories:', err);
      });
  };

  useEffect(() => {
    fetchFaqs();
    fetchCategories();
  }, []);

  const toggleFaq = (id) => {
    if (openFaqId === id) {
      setOpenFaqId(null);
    } else {
      setOpenFaqId(id);
    }
  };

  // Filtering logic with explicit for loops
  const filteredFaqs = [];
  for (let i = 0; i < faqs.length; i++) {
    const item = faqs[i];
    const itemCategory = item.category ? item.category.toLowerCase() : 'general';
    const selectedCategoryLower = selectedCategory.toLowerCase();

    const categoryMatch = selectedCategory === 'ALL' || itemCategory === selectedCategoryLower;
    
    const questionText = item.question ? item.question.toLowerCase() : '';
    const answerText = item.answer ? item.answer.toLowerCase() : '';
    const searchLower = searchTerm.toLowerCase();

    const searchMatch = 
      questionText.includes(searchLower) ||
      answerText.includes(searchLower);

    if (categoryMatch && searchMatch) {
      filteredFaqs.push(item);
    }
  }

  const renderedCategories = [];
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    renderedCategories.push(
      <button
        key={cat}
        onClick={() => setSelectedCategory(cat)}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
          selectedCategory === cat
            ? 'bg-cyan-600 text-white'
            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
        }`}
      >
        {cat}
      </button>
    );
  }

  const renderedFaqList = [];
  for (let i = 0; i < filteredFaqs.length; i++) {
    const faq = filteredFaqs[i];
    const faqId = faq._id || faq.id || i;
    const isOpen = openFaqId === faqId;

    renderedFaqList.push(
      <div 
        key={faqId} 
        className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden transition-all"
      >
        <button
          onClick={() => toggleFaq(faqId)}
          className="w-full p-4 text-left flex justify-between items-center hover:bg-slate-900/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              {faq.category || 'General'}
            </span>
            <h4 className="text-sm font-bold text-white">{faq.question}</h4>
          </div>
          <span className="text-slate-400 font-mono text-xs">
            {isOpen ? '[-]' : '[+]'}
          </span>
        </button>

        {isOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-800/50 text-xs text-slate-300 leading-relaxed bg-slate-900/20">
            {faq.answer}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search questions or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />

        <div className="flex gap-2 flex-wrap">
          {renderedCategories}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading && <p className="text-xs text-slate-500 italic">Loading FAQs...</p>}

        {!loading && filteredFaqs.length === 0 && (
          <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 italic">No matching questions found.</p>
          </div>
        )}

        {!loading && renderedFaqList}
      </div>
    </div>
  );
}