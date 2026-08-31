import React, { useState } from 'react';

//NUSFAT: Track Complaint Component for Residents - Module 3
function TrackComplaint() {
  const [trackingId, setTrackingId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }
    setLoading(true);
    setError('');
    setComplaint(null);
    try {
      const res = await fetch(`http://localhost:5000/api/complaint/track/${trackingId}`);
      const data = await res.json();
      if (res.ok) {
        setComplaint(data);
      } else {
        setError(data.message || 'Complaint not found.');
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'SUBMITTED') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (status === 'UNDER_REVIEW') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (status === 'RESOLVED') return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider mb-1">
          Track Your Complaint
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Enter your tracking ID to check the status
        </p>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Enter Tracking ID (e.g. UTIL-ABC123)"
            value={trackingId}
            onChange={e => setTrackingId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handleTrack}
            disabled={loading}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            {loading ? '...' : 'Track'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-xs font-bold">{error}</p>
          </div>
        )}

        {complaint && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Complaint Details
              </h4>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              <p><span className="font-bold text-slate-300">Tracking ID:</span> {complaint.trackingId}</p>
              <p><span className="font-bold text-slate-300">Name:</span> {complaint.residentName}</p>
              <p><span className="font-bold text-slate-300">Area:</span> {complaint.area}</p>
              <p><span className="font-bold text-slate-300">Utility:</span> {complaint.utilityType}</p>
              <p><span className="font-bold text-slate-300">Bill Amount:</span> BDT {complaint.billAmount}</p>
              <p><span className="font-bold text-slate-300">Reason:</span> {complaint.complaintReason}</p>
              <p><span className="font-bold text-slate-300">Submitted:</span> {new Date(complaint.createdAt).toLocaleDateString()}</p>
            </div>

            {complaint.managerReply && (
              <div className="mt-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                <p className="text-cyan-400 font-black text-[10px] uppercase tracking-wider mb-1">
                  Manager Reply
                </p>
                <p className="text-slate-300 text-xs">{complaint.managerReply}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
//NUSFAT END

export default TrackComplaint;