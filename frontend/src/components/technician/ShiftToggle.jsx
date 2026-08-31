import React, { useState } from 'react';

const ShiftToggle = ({ user }) => {
  const [status, setStatus] = useState('OFF_DUTY');
  const [loading, setLoading] = useState(false);

  const isOnDuty = status === 'ON_DUTY';

  const handleToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/user/toggle-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await response.json();
      if (response.ok) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6">

      {/* Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center gap-6 w-full max-w-md">

        {/* Icon */}
        <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center text-3xl
          ${isOnDuty ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600 bg-slate-800'}`}>
          {isOnDuty ? '🟢' : '⚫'}
        </div>

        {/* Status Text */}
        <div className="text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Status</p>
          <p className={`text-3xl font-black ${isOnDuty ? 'text-cyan-400' : 'text-slate-500'}`}>
            {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
          </p>
        </div>

        {/* Status Description */}
        <p className="text-xs text-slate-500 text-center">
          {isOnDuty
            ? 'You are visible to managers and available for task assignment'
            : 'You are not visible to managers for job distribution'}
        </p>

        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300
            ${isOnDuty
              ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
              : 'bg-cyan-600 text-white hover:bg-cyan-500'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Updating...' : isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
          <p className={`text-2xl font-black ${isOnDuty ? 'text-cyan-400' : 'text-slate-600'}`}>
            {isOnDuty ? 'ACTIVE' : 'INACTIVE'}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Dispatch Status</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
          <p className={`text-2xl font-black ${isOnDuty ? 'text-green-400' : 'text-slate-600'}`}>
            {isOnDuty ? 'YES' : 'NO'}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Available</p>
        </div>
      </div>
    </div>
  );
};

export default ShiftToggle;