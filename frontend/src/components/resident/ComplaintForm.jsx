import React, { useState } from 'react';

//NUSFAT: Complaint Form Component for Residents - Module 3
function ComplaintForm() {
  const [form, setForm] = useState({
    residentName: '',
    phone: '',
    area: '',
    utilityType: '',
    billAmount: '',
    complaintReason: ''
  });
  const [trackingId, setTrackingId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setTrackingId('');
    try {
      const res = await fetch('http://localhost:5000/api/complaint/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setTrackingId(data.trackingId);
        setForm({
          residentName: '',
          phone: '',
          area: '',
          utilityType: '',
          billAmount: '',
          complaintReason: ''
        });
      } else {
        setError(data.message || 'Failed to submit complaint.');
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider mb-1">
          Submit a Bill Complaint
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          File a complaint about your utility bill
        </p>

        {trackingId && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
            <p className="text-green-400 font-black text-xs uppercase tracking-wider">
              Complaint Submitted Successfully!
            </p>
            <p className="text-slate-400 text-xs mt-1">Your Tracking ID:</p>
            <p className="text-2xl font-black text-green-400 mt-1">{trackingId}</p>
            <p className="text-slate-500 text-[10px] mt-1">
              Save this ID to track your complaint status
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-xs font-bold">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="residentName"
              placeholder="Your full name"
              value={form.residentName}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              placeholder="+8801XXXXXXXXX"
              value={form.phone}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Area
            </label>
            <input
              type="text"
              name="area"
              placeholder="e.g. Dhanmondi, Gulshan"
              value={form.area}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Utility Type
            </label>
            <select
              name="utilityType"
              value={form.utilityType}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">Select Utility Type</option>
              <option value="DESCO">DESCO (Electricity)</option>
              <option value="WASA">WASA (Water)</option>
              <option value="TITAS">TITAS (Gas)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Bill Amount (BDT)
            </label>
            <input
              type="number"
              name="billAmount"
              placeholder="Enter bill amount"
              value={form.billAmount}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Complaint Reason
            </label>
            <textarea
              name="complaintReason"
              placeholder="Describe your complaint in detail..."
              value={form.complaintReason}
              onChange={handleChange}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      </div>
    </div>
  );
}
//NUSFAT END

export default ComplaintForm;