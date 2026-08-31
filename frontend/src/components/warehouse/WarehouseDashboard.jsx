import React, { useState, useEffect, useCallback } from 'react';
import CentralSparesLedger from './CentralSparesLedger';

const API = 'http://localhost:5000';

// --- UTILITY HELPERS ---
const fmtDate = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const stockStatus = (qty, threshold) => {
  if (qty === 0) return 'out';
  if (qty <= threshold) return 'low';
  return 'ok';
};
const statusBadge = { ok: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', low: 'bg-amber-500/15 text-amber-400 border-amber-500/30', out: 'bg-red-500/15 text-red-400 border-red-500/30' };
const statusLabel = { ok: 'In Stock', low: 'Low Stock', out: 'Out of Stock' };

const CATEGORIES = ['Transformers', 'Cabling', 'Substation Parts', 'Safety Gear', 'Smart Meters', 'Circuit Breakers', 'Tools', 'Other'];

function WarehouseDashboard({ user, onLogout }) {
  // --- INVENTORY STATE ---
  const [supplies, setSupplies] = useState([]);
  const [shipmentLogs, setShipmentLogs] = useState([]);
  const [loadingSupplies, setLoadingSupplies] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'shipment' | 'logs'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', msg: '...' }

  // --- SHIPMENT FORM STATE ---
  const [formSupplyId, setFormSupplyId] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formInvoice, setFormInvoice] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // --- NEW ITEM FORM STATE ---
  const [showAddItem, setShowAddItem] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState('Other');
  const [newUnit, setNewUnit] = useState('units');
  const [newThreshold, setNewThreshold] = useState('10');
  const [addingItem, setAddingItem] = useState(false);

  // --- FETCH HELPERS ---
  const fetchSupplies = useCallback(async () => {
    setLoadingSupplies(true);
    try {
      const res = await fetch(`${API}/api/supplies`);
      const data = await res.json();
      setSupplies(data);
    } catch {
      showNotification('error', 'Failed to load inventory. Ensure the backend is running.');
    } finally {
      setLoadingSupplies(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${API}/api/supplies/shipments?limit=30`);
      const data = await res.json();
      setShipmentLogs(data);
    } catch {
      // fail silently on logs
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => { fetchSupplies(); fetchLogs(); }, [fetchSupplies, fetchLogs]);

  const showNotification = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4500);
  };

  // --- METRICS ---
  const totalItems = supplies.length;
  const lowStockCount = supplies.filter(s => stockStatus(s.quantity, s.minThreshold) !== 'ok').length;
  const totalShipments = shipmentLogs.length;

  // --- FILTERED INVENTORY ---
  const filteredSupplies = supplies.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'All' || s.category === filterCategory;
    return matchSearch && matchCat;
  });

  // --- HANDLE SHIPMENT SUBMIT ---
  const handleShipmentSubmit = async (e) => {
    e.preventDefault();
    if (!formSupplyId || !formQty || !formSupplier) {
      showNotification('error', 'Please fill in all required fields.');
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await fetch(`${API}/api/supplies/shipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplyId: formSupplyId,
          quantityReceived: parseInt(formQty, 10),
          supplier: formSupplier,
          invoiceRef: formInvoice,
          notes: formNotes,
          receivedBy: user.name,
          receivedById: user._id || user.id || ''
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message);
        setFormSupplyId(''); setFormQty(''); setFormSupplier(''); setFormInvoice(''); setFormNotes('');
        await fetchSupplies();
        await fetchLogs();
      } else {
        showNotification('error', data.message || 'Failed to record shipment.');
      }
    } catch {
      showNotification('error', 'Network error. Could not reach backend.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // --- HANDLE ADD NEW ITEM ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newName || !newSku || !newCategory) {
      showNotification('error', 'Name, SKU, and category are required.');
      return;
    }
    setAddingItem(true);
    try {
      const res = await fetch(`${API}/api/supplies/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, sku: newSku, category: newCategory, unit: newUnit, minThreshold: parseInt(newThreshold, 10) || 10 })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', `"${newName}" added to inventory catalog.`);
        setNewName(''); setNewSku(''); setNewCategory('Other'); setNewUnit('units'); setNewThreshold('10');
        setShowAddItem(false);
        await fetchSupplies();
      } else {
        showNotification('error', data.message || 'Failed to add item.');
      }
    } catch {
      showNotification('error', 'Network error.');
    } finally {
      setAddingItem(false);
    }
  };

  // ===================== RENDER =====================
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[38rem] h-[38rem] bg-cyan-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-8%] w-[32rem] h-[32rem] bg-violet-500/5 rounded-full blur-[110px] pointer-events-none" />

      {/* --- NOTIFICATION TOAST --- */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-5 py-4 rounded-xl border shadow-2xl max-w-sm animate-slide-in
          ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <span className="text-lg mt-0.5">{notification.type === 'success' ? '✓' : '✕'}</span>
          <p className="text-sm leading-snug">{notification.msg}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 md:p-8 relative z-10">

        {/* === HEADER === */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Central Depot Terminal</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">{user.name}</h1>
            <p className="text-slate-500 text-xs mt-1">Stock Ledger · Shipment Management · Audit Trail</p>
          </div>
          <button
            onClick={onLogout}
            className="px-5 py-2.5 bg-slate-950 border border-slate-800 hover:border-red-500/40 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 transition-all duration-200 active:scale-95"
          >
            Disconnect Depot Node
          </button>
        </div>

        {/* === METRICS BAR === */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Catalog Items', value: totalItems, icon: '🗄️', color: 'text-cyan-400', sub: 'unique parts tracked' },
            { label: 'Stock Alerts', value: lowStockCount, icon: '⚠️', color: lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400', sub: lowStockCount > 0 ? 'require attention' : 'all levels nominal' },
            { label: 'Shipments Logged', value: totalShipments, icon: '📦', color: 'text-violet-400', sub: 'recent arrivals' },
          ].map(m => (
            <div key={m.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center gap-4">
              <span className="text-3xl">{m.icon}</span>
              <div>
                <div className={`text-3xl font-black ${m.color}`}>{loadingSupplies && m.label !== 'Shipments Logged' ? '—' : m.value}</div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">{m.label}</div>
                <div className="text-xs text-slate-600">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* === TABS === */}
        <div className="flex gap-1 mb-6 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
          {[
            { id: 'inventory', label: '📋 Inventory Ledger' },
            { id: 'shipment', label: '📦 Record Shipment' },
            { id: 'logs', label: '🕑 Arrival Audit Log' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200
                ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===================== TAB: INVENTORY ===================== */}
        {activeTab === 'inventory' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-200">Central Spares Ledger</h2>
                <p className="text-xs text-slate-500">Full catalog of emergency equipment &amp; repair hardware stored at this depot</p>
              </div>
              <button
                onClick={() => setShowAddItem(v => !v)}
                className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 rounded-xl text-xs font-bold text-cyan-400 transition-all duration-200 active:scale-95"
              >
                {showAddItem ? '✕ Cancel' : '+ Add New Part'}
              </button>
            </div>

            {/* Add New Item Form */}
            {showAddItem && (
              <form onSubmit={handleAddItem} className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">Part Name <span className="text-red-400">*</span></label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. 500 kVA Transformer"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">SKU / Part Code <span className="text-red-400">*</span></label>
                  <input value={newSku} onChange={e => setNewSku(e.target.value)} required placeholder="e.g. TRF-500KVA"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">Category <span className="text-red-400">*</span></label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60 transition-colors">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">Unit</label>
                  <input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="e.g. units, meters, pairs"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">Low Stock Threshold</label>
                  <input type="number" min="0" value={newThreshold} onChange={e => setNewThreshold(e.target.value)} placeholder="10"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors" />
                </div>
                <div className="flex items-end">
                  <button type="submit" disabled={addingItem}
                    className="w-full px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 rounded-xl text-xs font-bold text-cyan-300 transition-all duration-200 disabled:opacity-50 active:scale-95">
                    {addingItem ? 'Adding...' : '✓ Add to Catalog'}
                  </button>
                </div>
              </form>
            )}

            {loadingSupplies ? (
              <div className="text-center py-16 text-slate-500 text-sm animate-pulse">Loading inventory data…</div>
            ) : (
              <CentralSparesLedger
                supplies={supplies}
                user={user}
                onRefresh={fetchSupplies}
                showNotification={showNotification}
                onGoToShipment={(supplyId) => {
                  setFormSupplyId(supplyId);
                  setActiveTab('shipment');
                }}
              />
            )}
          </div>
        )}

        {/* ===================== TAB: RECORD SHIPMENT ===================== */}
        {activeTab === 'shipment' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md max-w-2xl">
            <div className="mb-6">
              <h2 className="text-base font-bold text-slate-200">Record Bulk Shipment Arrival</h2>
              <p className="text-xs text-slate-500 mt-1">Log incoming supply shipments from parts vendors to update stock counts.</p>
            </div>

            {loadingSupplies ? (
              <div className="text-center py-12 text-slate-500 text-sm animate-pulse">Loading supply catalog...</div>
            ) : (
              <form onSubmit={handleShipmentSubmit} className="space-y-5" id="shipment-form">

                {/* Supply Item Selector */}
                <div>
                  <label htmlFor="supply-selector" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Supply Item <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="supply-selector"
                    value={formSupplyId} onChange={e => setFormSupplyId(e.target.value)} required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none transition-colors"
                  >
                    <option value="">— Select incoming part —</option>
                    {CATEGORIES.filter(cat => supplies.some(s => s.category === cat)).map(cat => (
                      <optgroup key={cat} label={cat}>
                        {supplies.filter(s => s.category === cat).map(s => (
                          <option key={s._id} value={s._id}>{s.name} ({s.sku}) — Current: {s.quantity} {s.unit}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {formSupplyId && (() => {
                    const s = supplies.find(x => x._id === formSupplyId);
                    if (!s) return null;
                    const st = stockStatus(s.quantity, s.minThreshold);
                    return (
                      <div className={`mt-2 px-3 py-2 rounded-lg border text-xs font-semibold ${statusBadge[st]}`}>
                        Current stock: <span className="font-black">{s.quantity} {s.unit}</span> — {statusLabel[st]}
                      </div>
                    );
                  })()}
                </div>

                {/* Quantity Received */}
                <div>
                  <label htmlFor="qty-received" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Quantity Received <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="qty-received"
                    type="number" min="1" value={formQty} onChange={e => setFormQty(e.target.value)} required
                    placeholder="e.g. 100"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                  {formSupplyId && formQty && (() => {
                    const s = supplies.find(x => x._id === formSupplyId);
                    const newQty = (s?.quantity || 0) + parseInt(formQty || '0', 10);
                    return (
                      <p className="text-xs text-slate-500 mt-1.5">
                        Stock after shipment: <span className="text-emerald-400 font-bold">{newQty} {s?.unit || 'units'}</span>
                      </p>
                    );
                  })()}
                </div>

                {/* Supplier Name */}
                <div>
                  <label htmlFor="supplier-name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Supplier / Vendor <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="supplier-name"
                    type="text" value={formSupplier} onChange={e => setFormSupplier(e.target.value)} required
                    placeholder="e.g. Alpha Grid Systems Ltd."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* Invoice Ref */}
                <div>
                  <label htmlFor="invoice-ref" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Invoice / Manifest Ref # <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    id="invoice-ref"
                    type="text" value={formInvoice} onChange={e => setFormInvoice(e.target.value)}
                    placeholder="e.g. INV-2026-00432"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="shipment-notes" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Delivery Notes <span className="text-slate-600">(optional)</span>
                  </label>
                  <textarea
                    id="shipment-notes"
                    rows={3} value={formNotes} onChange={e => setFormNotes(e.target.value)}
                    placeholder="e.g. 2 units arrived with minor cosmetic damage. Accepted after inspection."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Receiver (auto-populated) */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-slate-500 text-xs">Received by:</span>
                  <span className="text-sm font-bold text-slate-200">{user.name}</span>
                  <span className="ml-auto text-xs text-slate-600 font-mono">{user.auditorId || user.employeeId || user._id?.slice(-6) || 'ID'}</span>
                </div>

                {/* Submit */}
                <button
                  type="submit" id="submit-shipment" disabled={formSubmitting}
                  className="w-full py-3.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 hover:border-cyan-500/60 rounded-xl text-sm font-bold text-cyan-300 hover:text-cyan-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {formSubmitting ? (
                    <><span className="animate-spin">⟳</span> Processing Shipment...</>
                  ) : (
                    <><span>📦</span> Confirm Shipment & Update Stock</>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ===================== TAB: AUDIT LOG ===================== */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-200">Shipment Arrival Audit Trail</h2>
              <p className="text-xs text-slate-500 mt-1">Immutable log of all recorded bulk shipment arrivals at this depot.</p>
            </div>

            {loadingLogs ? (
              <div className="text-center py-16 text-slate-500 text-sm animate-pulse">Loading audit log...</div>
            ) : shipmentLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm font-semibold">No shipments recorded yet.</p>
                <p className="text-xs text-slate-700 mt-1">Use the "Record Shipment" tab to log your first arrival.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-950/80 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-semibold">Date / Time</th>
                      <th className="text-left px-4 py-3 font-semibold">Part Name</th>
                      <th className="text-left px-4 py-3 font-semibold">SKU</th>
                      <th className="text-right px-4 py-3 font-semibold">Qty Added</th>
                      <th className="text-left px-4 py-3 font-semibold">Supplier</th>
                      <th className="text-left px-4 py-3 font-semibold">Invoice Ref</th>
                      <th className="text-left px-4 py-3 font-semibold">Received By</th>
                      <th className="text-left px-4 py-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {shipmentLogs.map((log, i) => (
                      <tr key={log._id || i} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtDate(log.receivedAt)}</td>
                        <td className="px-4 py-3 font-medium text-slate-200 max-w-[180px] truncate" title={log.supplyName}>{log.supplyName}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.supplySku}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-sm">
                            +{log.quantityReceived}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{log.supplier}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.invoiceRef || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{log.receivedBy}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs max-w-[160px] truncate" title={log.notes}>{log.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes slide-in { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-in { animation: slide-in 0.3s ease; }
      `}</style>
    </div>
  );
}

export default WarehouseDashboard;