import React, { useState, useEffect } from 'react';

//Nusfat: Scroll Banner Component
function ScrollBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/banner/active');
        const data = await res.json();
        setBanner(data);
      } catch {
        setBanner(null);
      }
    };
    fetchBanner();
    const interval = setInterval(fetchBanner, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!banner || !banner.message) return null;

  return (
    <div className="w-full bg-red-500/90 border-b border-red-400/50 py-2 overflow-hidden">
      <div style={{
        display: 'flex',
        whiteSpace: 'nowrap',
        animation: 'marquee 20s linear infinite'
      }}>
        <span className="text-white text-xs font-bold px-8">
          🚨 {banner.message} 🚨 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          🚨 {banner.message} 🚨 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          🚨 {banner.message} 🚨
        </span>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

export default ScrollBanner;