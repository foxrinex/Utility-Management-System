import React, { useState, useEffect } from 'react';

//NUSFAT: Manager Complaints Component for Admin - Module 3
function ManagerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/complaint/all');
      const data = await res.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (complaint) => {
    setSelected(complaint);
    setReply(complaint.managerReply || '');
    setStatus(complaint.status);
    setSuccess('');
    setError('');
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch(
        `http://localhost:5000/api/complaint/update/${selected.trackingId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, managerReply: reply })
        }
      );
      if (res.ok) {
        setSuccess('Complaint updated successfully!');
        fetchComplaints();
      } else {
        setError('Failed to update complaint.');
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'SUBMITTED') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    if (status === 'UNDER_REVIEW') return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
    if (status === 'RESOLVED') return 'bg-green-500/20 text-green-400 border border-green-500/30';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-slate-500 text-xs">Loading complaints...</p>
    </div>
  );

  return (
    <div className="flex gap-6 p-6 h-full">

      {/* Complaints List */}
      <div className="w-1/2 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider mb-1">
            Bill Complaints
          </h3>
          <p className="text-xs text-slate-500">
            Total: {complaints.length} complaints
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-red-400 text-xs font-bold">{error}</p>
          </div>
        )}

        {complaints.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No complaints submitted yet.</p>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-96">
            {complaints.map((c) => (
              <div
                key={c._id}
                onClick={() => handleSelect(c)}
                className={`bg-slate-950 border rounded-xl p-4 cursor-pointer transition-all hover:border-cyan-500/50
                  ${selected?._id === c._id ? 'border-cyan-500' : 'border-slate-800'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-black text-cyan-400">{c.trackingId}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(c.status)}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-white">{c.residentName}</p>
                <p className="text-[10px] text-slate-500">{c.utilityType} — {c.area} — BDT {c.billAmount}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complaint Detail */}
      <div className="w-1/2 flex flex-col gap-4">
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 text-xs">Select a complaint to view details</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider mb-1">
                Complaint Details
              </h3>
            </div>

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <p className="text-green-400 text-xs font-bold">{success}</p>
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs text-slate-400">
              <p><span className="font-bold text-slate-300">Tracking ID:</span> {selected.trackingId}</p>
              <p><span className="font-bold text-slate-300">Name:</span> {selected.residentName}</p>
              <p><span className="font-bold text-slate-300">Phone:</span> {selected.phone}</p>
              <p><span className="font-bold text-slate-300">Area:</span> {selected.area}</p>
              <p><span className="font-bold text-slate-300">Utility:</span> {selected.utilityType}</p>
              <p><span className="font-bold text-slate-300">Bill Amount:</span> BDT {selected.billAmount}</p>
              <p><span className="font-bold text-slate-300">Reason:</span> {selected.complaintReason}</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Update Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Manager Reply
              </label>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={3}
                placeholder="Type your reply to the resident..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>

            <button
              onClick={handleUpdate}
              disabled={updating}
              className={`w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all
                ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {updating ? 'Updating...' : 'Update Complaint'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
//NUSFAT END

export default ManagerComplaints;