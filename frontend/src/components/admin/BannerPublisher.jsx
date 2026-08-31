import React, { useState, useEffect } from 'react';

//NUSFAT: Banner Publisher Component for Control Manager - Module 2
function BannerPublisher() {
  const [message, setMessage] = useState('');
  const [banners, setBanners] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBanners = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/banner/all');
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } catch {
      console.error('Failed to fetch banners');
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handlePost = async () => {
    if (!message.trim()) {
      setError('Please type a message first.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/banner/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Banner published successfully!');
        setMessage('');
        fetchBanners();
      } else {
        setError(data.message || 'Failed to publish banner.');
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/banner/toggle/${id}`, {
        method: 'PATCH'
      });
      fetchBanners();
    } catch {
      setError('Failed to toggle banner.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/banner/delete/${id}`, {
        method: 'DELETE'
      });
      setSuccess('Banner removed successfully.');
      fetchBanners();
    } catch {
      setError('Failed to remove banner.');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Publish Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider mb-1">
          Emergency Broadcast System
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Publish emergency announcements visible to all residents
        </p>

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
            <p className="text-green-400 text-xs font-bold">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-xs font-bold">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Announcement Message
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Main water line under repair in Sector 10. Estimated restoration: 6 hours."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          <button
            onClick={handlePost}
            disabled={loading}
            className={`w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Publishing...' : 'Publish Banner'}
          </button>
        </div>
      </div>

      {/* All Banners List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-4">
          Posted Announcements ({banners.length})
        </h4>

        {banners.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No announcements posted yet.</p>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <div
                key={banner._id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      banner.isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      {banner.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(banner.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-white mb-3">{banner.message}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(banner._id)}
                    className={`flex-1 py-1.5 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all border ${
                      banner.isActive
                        ? 'bg-amber-900/40 hover:bg-amber-900/60 text-amber-400 border-amber-900/50'
                        : 'bg-green-900/40 hover:bg-green-900/60 text-green-400 border-green-900/50'
                    }`}
                  >
                    {banner.isActive ? 'Set Inactive' : 'Set Active'}
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="flex-1 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all border border-red-900/50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
//NUSFAT END

export default BannerPublisher;