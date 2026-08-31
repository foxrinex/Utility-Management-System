import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000';

function VerificationIDsPanel() {
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [generating, setGenerating] = useState(null);

  const fetchIds = () => {
    setLoading(true);

    fetch(`${API}/api/verification/list`)
      .then((res) => res.json())
      .then((data) => {
        setIds(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Verification ID fetch error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchIds();
  }, []);

  const handleGenerate = (type) => {
    setGenerating(type);

    fetch(`${API}/api/verification/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
      .then((res) => res.json())
      .then(() => {
        fetchIds();
      })
      .catch((err) => {
        console.error('Generate error:', err);
      })
      .finally(() => {
        setGenerating(null);
      });
  };

  const handleRevoke = (mongoId) => {
    let entry = null;

    for (let i = 0; i < ids.length; i++) {
      if (ids[i]._id === mongoId) {
        entry = ids[i];
        break;
      }
    }

    const message = entry?.used && entry?.usedBy
      ? `This ID was claimed by "${entry.usedBy}". Revoking it will permanently delete their account. Continue?`
      : 'Revoke and permanently delete this verification ID?';

    if (!window.confirm(message)) {
      return;
    }

    fetch(`${API}/api/verification/revoke/${mongoId}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => {
        fetchIds();
      })
      .catch((err) => {
        console.error('Revoke error:', err);
      });
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(code);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    });
  };

  // Build filtered array via a clean for loop
  const filtered = [];
  for (let i = 0; i < ids.length; i++) {
    if (filterType === 'ALL' || ids[i].type === filterType) {
      filtered.push(ids[i]);
    }
  }

  // Calculate metrics via a single clear loop pass
  let techCount = 0;
  let depotCount = 0;
  let usedCount = 0;

  for (let i = 0; i < ids.length; i++) {
    const item = ids[i];
    if (item.used) {
      usedCount++;
    } else if (item.type === 'technician') {
      techCount++;
    } else if (item.type === 'warehouse') {
      depotCount++;
    }
  }

  const statBoxes = [
    { label: 'Active Technician IDs', value: techCount, color: 'text-cyan-400' },
    { label: 'Active Depot IDs', value: depotCount, color: 'text-violet-400' },
    { label: 'Used / Claimed', value: usedCount, color: 'text-slate-400' },
  ];

  const renderedStatBoxes = [];
  for (let i = 0; i < statBoxes.length; i++) {
    const s = statBoxes[i];
    renderedStatBoxes.push(
      <div key={s.label} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
      </div>
    );
  }

  const filterTabs = ['ALL', 'technician', 'warehouse'];
  const renderedFilterTabs = [];
  for (let i = 0; i < filterTabs.length; i++) {
    const f = filterTabs[i];
    renderedFilterTabs.push(
      <button
        key={f}
        onClick={() => setFilterType(f)}
        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
          filterType === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        {f === 'ALL' ? 'ALL' : f === 'technician' ? 'TECHNICIAN' : 'DEPOT'}
      </button>
    );
  }

  const renderedList = [];
  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];
    renderedList.push(
      <div
        key={entry._id}
        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
          entry.used
            ? 'border-slate-800 bg-slate-900/30 opacity-50'
            : entry.type === 'technician'
            ? 'border-cyan-900/40 bg-cyan-950/20'
            : 'border-violet-900/40 bg-violet-950/20'
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                entry.type === 'technician'
                  ? 'bg-cyan-900/50 text-cyan-400'
                  : 'bg-violet-900/50 text-violet-400'
              }`}
            >
              {entry.type === 'technician' ? '🔧 TECH' : '🏭 DEPOT'}
            </span>
            {entry.used && (
              <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                ✓ CLAIMED{entry.usedBy ? ` by ${entry.usedBy}` : ''}
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-white tracking-wide truncate">{entry.code}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Created {new Date(entry.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2 ml-3 flex-shrink-0">
          {!entry.used && (
            <button
              onClick={() => handleCopy(entry.code)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                copiedId === entry.code
                  ? 'bg-green-700 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {copiedId === entry.code ? '✓ COPIED' : 'COPY'}
            </button>
          )}
          <button
            onClick={() => handleRevoke(entry._id)}
            className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-all"
          >
            REVOKE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {renderedStatBoxes}
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          Generate New Verification ID
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Each ID is unique and single-use. Share it with the employee so they can register their account. The ID becomes their permanent Employee or Auditor ID after registration.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleGenerate('technician')}
            disabled={generating === 'technician'}
            className="py-3 bg-cyan-600/20 border border-cyan-600/40 text-cyan-400 text-xs font-black rounded-xl hover:bg-cyan-600/30 hover:border-cyan-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-base">🔧</span>
            {generating === 'technician' ? 'GENERATING...' : 'GENERATE TECHNICIAN ID'}
          </button>
          <button
            onClick={() => handleGenerate('warehouse')}
            disabled={generating === 'warehouse'}
            className="py-3 bg-violet-600/20 border border-violet-600/40 text-violet-400 text-xs font-black rounded-xl hover:bg-violet-600/30 hover:border-violet-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-base">🏭</span>
            {generating === 'warehouse' ? 'GENERATING...' : 'GENERATE DEPOT ID'}
          </button>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated IDs</h4>
          <div className="flex gap-2">
            {renderedFilterTabs}
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-600 italic py-4 text-center">Loading verification IDs...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-600 italic py-4 text-center">
            No IDs found. Use the buttons above to generate one.
          </p>
        ) : (
          <div className="space-y-2">
            {renderedList}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationIDsPanel;