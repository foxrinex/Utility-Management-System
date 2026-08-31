import React, { useState, useRef, useEffect } from 'react';

//NUSFAT: Outage Support Chatbot - Module 4 (Gemini AI)
function ChatbotPage({ user }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your utility support assistant powered by Gemini AI. I can help you with power, water, and gas outage questions. What is your area and how can I help you?'
    }
  ]);
  const [input, setInput] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, area: area })
      });
      const data = await res.json();
      const botMessage = { sender: 'bot', text: data.reply || 'Sorry, I could not process your request.' };
      setMessages(prev => [...prev, botMessage]);
    } catch {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
          Utility Support Assistant
        </h3>
        <p className="text-xs text-slate-500 mt-1">Powered by Gemini AI</p>
      </div>

      {/* Area Input */}
      <div className="px-4 py-3 border-b border-slate-800">
        <input
          type="text"
          placeholder="Enter your area (e.g. Dhanmondi, Gulshan)"
          value={area}
          onChange={e => setArea(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl text-xs ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none'
                  : 'bg-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 px-4 py-2 rounded-2xl rounded-bl-none text-xs">
              Typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className={`px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
//NUSFAT END

export default ChatbotPage;