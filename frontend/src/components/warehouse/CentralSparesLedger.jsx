import React, { useState, useMemo } from 'react';

const API = 'http://localhost:5000';
const CATEGORIES = ['Transformers', 'Cabling', 'Substation Parts', 'Safety Gear', 'Smart Meters', 'Circuit Breakers', 'Tools', 'Other'];

const stockStatus = (qty, threshold) => {
  if (qty === 0) return 'out';
  if (qty <= threshold) return 'low';
  return 'ok';
};
const statusMeta = {
  ok:  { label: 'In Stock',     cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  low: { label: 'Low Stock',    cls: 'bg-amber-500/15  text-amber-400  border-amber-500/30'  },
  out: { label: 'Out of Stock', cls: 'bg-red-500/15    text-red-400    border-red-500/30'    },
};

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function EditModal({ item, user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: item.name, sku: item.sku, category: item.category,
    quantity: item.quantity, unit: item.unit, minThreshold: item.minThreshold,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const res = await fetch(`${API}/api/supplies/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, updatedBy: user.name }),
      });
      const data = await res.json();
      if (res.ok) { onSaved(data.supply); onClose(); }
      else setErr(data.message || 'Update failed.');
    } catch { setErr('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Edit Supply Item</h3>
            <p className="text-xs text-slate-500 mt-0.5">Modify catalog entry for this part</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-xl leading-none transition-colors">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Part Name *', key: 'name', type: 'text', full: true },
            { label: 'SKU / Part Code *', key: 'sku', type: 'text' },
            { label: 'Unit', key: 'unit', type: 'text' },
            { label: 'Quantity', key: 'quantity', type: 'number' },
            { label: 'Low Stock Threshold', key: 'minThreshold', type: 'number' },
          ].map(({ label, key, type, full }) => (
            <div key={key} className={full ? 'col-span-2' : ''}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
              <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} required={label.endsWith('*')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60 transition-colors" />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60 transition-colors">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {err && <p className="col-span-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</p>}
          <div className="col-span-2 flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : '✓ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CentralSparesLedger({ supplies, user, onRefresh, onGoToShipment, showNotification }) {
  // --- FILTER STATE ---
  const [search, setSearch]           = useState('');
  const [catFilter, setCatFilter]     = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // --- SORT STATE ---
  const [sortKey, setSortKey]   = useState('name');
  const [sortDir, setSortDir]   = useState('asc');

  // --- PAGINATION ---
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // --- COLUMN VISIBILITY ---
  const [cols, setCols] = useState({ sku: true, category: true, stock: true, unit: true, threshold: true, status: true, supplier: true, updated: false });
  const [showColMenu, setShowColMenu] = useState(false);
  const toggleCol = (k) => setCols(c => ({ ...c, [k]: !c[k] }));

  // --- EDIT MODAL ---
  const [editItem, setEditItem]   = useState(null);

  // --- ADJUSTING ---
  const [adjusting, setAdjusting] = useState({});

  const handleAdjust = async (item, delta) => {
    const newQty = Math.max(0, item.quantity + delta);
    setAdjusting(a => ({ ...a, [item._id]: true }));
    try {
      const res = await fetch(`${API}/api/supplies/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty, updatedBy: user.name }),
      });
      if (res.ok) { showNotification('success', `${item.name}: stock ${delta > 0 ? `+${delta}` : delta} → ${newQty} ${item.unit}`); onRefresh(); }
      else showNotification('error', 'Could not update stock.');
    } catch { showNotification('error', 'Network error.'); }
    finally { setAdjusting(a => ({ ...a, [item._id]: false })); }
  };

  const handleEditSaved = (updated) => {
    showNotification('success', `"${updated.name}" updated successfully.`);
    onRefresh();
  };

  // --- SORT HANDLER ---
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  // --- EXPORT ---
  const exportCSV = () => {
    const headers = ['Name','SKU','Category','Quantity','Unit','Min Threshold','Status','Last Supplier','Last Updated'];
    const rows = filtered.map(s => [
      `"${s.name}"`, s.sku, s.category, s.quantity, s.unit, s.minThreshold,
      statusMeta[stockStatus(s.quantity, s.minThreshold)].label,
      s.lastSupplier || '', fmtDate(s.updatedAt),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `spares_ledger_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const exportJSON = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' }));
    a.download = `spares_ledger_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  // --- DERIVED DATA ---
  const filtered = useMemo(() => {
    let list = [...supplies];
    if (search)           list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.sku.toLowerCase().includes(search.toLowerCase()) || (s.lastSupplier || '').toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== 'All')    list = list.filter(s => s.category === catFilter);
    if (statusFilter !== 'All') list = list.filter(s => stockStatus(s.quantity, s.minThreshold) === statusFilter);
    list.sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [supplies, search, catFilter, statusFilter, sortKey, sortDir]);

  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = pageSize === 0 ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize);

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <span className="opacity-20 ml-1">↕</span>;
    return <span className="ml-1 text-cyan-400">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const Th = ({ label, k, right }) => (
    <th onClick={() => handleSort(k)}
      className={`px-4 py-3 font-semibold cursor-pointer hover:text-slate-200 transition-colors select-none whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
      {label}<SortIcon k={k} />
    </th>
  );

  const statusPills = [
    { id: 'All', label: 'All Items' },
    { id: 'ok',  label: '✓ In Stock' },
    { id: 'low', label: '⚠ Low Stock' },
    { id: 'out', label: '✕ Out of Stock' },
  ];

  return (
    <>
      {editItem && <EditModal item={editItem} user={user} onClose={() => setEditItem(null)} onSaved={handleEditSaved} />}

      {/* ── TOOLBAR ── */}
      <div className="flex flex-col gap-4 mb-5">

        {/* Row 1: Search + Export + Columns */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍  Search by name, SKU or supplier…"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors" />

          <div className="flex gap-2 flex-wrap">
            <button onClick={exportCSV} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors whitespace-nowrap">⬇ CSV</button>
            <button onClick={exportJSON} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors whitespace-nowrap">⬇ JSON</button>

            {/* Column visibility */}
            <div className="relative">
              <button onClick={() => setShowColMenu(v => !v)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors whitespace-nowrap">
                ⚙ Columns
              </button>
              {showColMenu && (
                <div className="absolute right-0 top-full mt-2 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 w-44">
                  {Object.entries({ sku: 'SKU', category: 'Category', stock: 'Stock', unit: 'Unit', threshold: 'Threshold', status: 'Status', supplier: 'Last Supplier', updated: 'Last Updated' }).map(([k, lbl]) => (
                    <label key={k} className="flex items-center gap-2 py-1 cursor-pointer text-xs text-slate-300 hover:text-white">
                      <input type="checkbox" checked={cols[k]} onChange={() => toggleCol(k)}
                        className="accent-cyan-400 w-3.5 h-3.5" />
                      {lbl}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Category filter pills */}
        <div className="flex flex-wrap gap-2">
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => { setCatFilter(c); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${catFilter === c ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Row 3: Status filter pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-600 font-semibold">Status:</span>
          {statusPills.map(({ id, label }) => (
            <button key={id} onClick={() => { setStatusFilter(id); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${statusFilter === id ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'}`}>
              {label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-600">{filtered.length} item{filtered.length !== 1 ? 's' : ''} found</span>
        </div>
      </div>

      {/* ── DATA GRID ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <p className="text-4xl mb-3">🗃️</p>
          <p className="text-sm font-semibold">No items match your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-950/80 text-xs text-slate-500 uppercase tracking-wider">
                <Th label="Part Name" k="name" />
                {cols.sku       && <Th label="SKU"           k="sku" />}
                {cols.category  && <Th label="Category"      k="category" />}
                {cols.stock     && <Th label="Stock"         k="quantity" right />}
                {cols.unit      && <th className="text-left px-4 py-3 font-semibold">Unit</th>}
                {cols.threshold && <Th label="Threshold"     k="minThreshold" right />}
                {cols.status    && <th className="text-left px-4 py-3 font-semibold">Status</th>}
                {cols.supplier  && <th className="text-left px-4 py-3 font-semibold">Last Supplier</th>}
                {cols.updated   && <Th label="Last Updated"  k="updatedAt" />}
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginated.map(s => {
                const st = stockStatus(s.quantity, s.minThreshold);
                const pct = s.minThreshold > 0 ? Math.min(100, Math.round((s.quantity / (s.minThreshold * 2)) * 100)) : 100;
                const barColor = st === 'ok' ? 'bg-emerald-500' : st === 'low' ? 'bg-amber-500' : 'bg-red-500';
                const isAdj = adjusting[s._id];
                return (
                  <tr key={s._id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* Name + mini stock bar */}
                    <td className="px-4 py-3 font-medium text-slate-200 min-w-[160px]">
                      <div>{s.name}</div>
                      <div className="mt-1.5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    {cols.sku       && <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">{s.sku}</td>}
                    {cols.category  && <td className="px-4 py-3 text-slate-400 text-xs">{s.category}</td>}
                    {cols.stock     && <td className="px-4 py-3 text-right font-black text-lg text-slate-100">{s.quantity}</td>}
                    {cols.unit      && <td className="px-4 py-3 text-slate-500 text-xs">{s.unit}</td>}
                    {cols.threshold && <td className="px-4 py-3 text-right text-slate-600 text-xs">{s.minThreshold}</td>}
                    {cols.status    && (
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${statusMeta[st].cls}`}>
                          {statusMeta[st].label}
                        </span>
                      </td>
                    )}
                    {cols.supplier  && <td className="px-4 py-3 text-slate-500 text-xs max-w-[140px] truncate">{s.lastSupplier || '—'}</td>}
                    {cols.updated   && <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{fmtDate(s.updatedAt)}</td>}

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        {/* Quick adjust */}
                        <button disabled={isAdj} onClick={() => handleAdjust(s, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 hover:border-red-500/40 rounded-lg text-xs font-black text-slate-400 transition-colors disabled:opacity-30">−</button>
                        <button disabled={isAdj} onClick={() => handleAdjust(s, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/40 rounded-lg text-xs font-black text-slate-400 transition-colors disabled:opacity-30">+</button>

                        {/* Edit */}
                        <button onClick={() => setEditItem(s)}
                          className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/40 rounded-lg text-xs transition-colors" title="Edit item">✎</button>

                        {/* Restock shortcut */}
                        <button onClick={() => onGoToShipment(s._id)}
                          className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-violet-500/20 hover:text-violet-400 border border-slate-700 hover:border-violet-500/40 rounded-lg text-xs transition-colors" title="Log shipment for this item">📦</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PAGINATION ── */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Rows per page:</span>
            {[10, 25, 50, 0].map(n => (
              <button key={n} onClick={() => { setPageSize(n); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg border transition-colors font-bold ${pageSize === n ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                {n === 0 ? 'All' : n}
              </button>
            ))}
          </div>
          {pageSize > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg font-bold disabled:opacity-30 hover:text-white transition-colors">‹ Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg font-bold disabled:opacity-30 hover:text-white transition-colors">Next ›</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
