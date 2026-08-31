// Turan: Transaction Auditor - Control Manager Dashboard Component
// Secure audit view for incoming Stripe & bKash premium alert subscription payments

import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:5000';

// ---- DEMO SEED DATA (used when backend has no transactions yet) ----
const DEMO_TRANSACTIONS = [
  {
    _id: 'demo_001',
    username: 'rezaul_hasan',
    phone: '+8801711234567',
    amount: 150,
    currency: 'BDT',
    paymentMethod: 'bkash',
    paymentIdentifier: '8N7A6W5X9Y',
    subscriptionPlan: 'Premium Utility Outage Alerts (SMS & Push)',
    status: 'PENDING_AUDIT',
    auditedBy: null,
    auditedAt: null,
    auditNotes: '',
    isSandbox: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    _id: 'demo_003',
    username: 'karim_molla',
    phone: '+8801612345678',
    amount: 150,
    currency: 'BDT',
    paymentMethod: 'bkash',
    paymentIdentifier: '3K9P1Q8R7S',
    subscriptionPlan: 'Premium Utility Outage Alerts (SMS & Push)',
    status: 'FLAGGED',
    auditedBy: 'admin',
    auditedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    auditNotes: 'TrxID could not be cross-verified in bKash merchant portal.',
    isSandbox: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    _id: 'demo_004',
    username: 'sumaiya_akter',
    phone: '+8801912233445',
    amount: 150,
    currency: 'BDT',
    paymentMethod: 'bkash',
    paymentIdentifier: '5T2U8V4W1X',
    subscriptionPlan: 'Premium Utility Outage Alerts (SMS & Push)',
    status: 'PENDING_AUDIT',
    auditedBy: null,
    auditedAt: null,
    auditNotes: '',
    isSandbox: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  }
];

// ---- HELPER FUNCTIONS ----
const maskPhone = (phone) => {
  if (!phone || phone.length < 8) return phone;
  return phone.slice(0, 6) + '****' + phone.slice(-4);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const STATUS_CONFIG = {
  PENDING_AUDIT: { label: 'Pending Audit', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '⏳' },
  VERIFIED:      { label: 'Verified',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  icon: '✅' },
  FLAGGED:       { label: 'Flagged',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: '🚩' },
  FAILED:        { label: 'Failed',         color: '#64748b', bg: 'rgba(100,116,139,0.12)',border: 'rgba(100,116,139,0.3)',icon: '✖' },
};

const GATEWAY_CONFIG = {
  bkash:  { label: 'bKash',  color: '#e40076', icon: '📱' },
};

// ---- MAIN COMPONENT ----
export default function TransactionAuditor({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats]               = useState({ totalRevenueBDT: 0, pendingCount: 0, verifiedCount: 0, flaggedCount: 0 });
  const [loading, setLoading]           = useState(false);
  const [usingDemo, setUsingDemo]       = useState(false);

  // Filters
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');

  // UI state
  const [phoneMasked, setPhoneMasked]   = useState(true);
  const [selectedTx, setSelectedTx]     = useState(null);
  const [auditNotes, setAuditNotes]     = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied]             = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ---- LOAD TRANSACTIONS ----
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter, gateway: gatewayFilter, limit: 50 });
      const res = await fetch(`${API}/api/transactions/auditor/all?${params}`);
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setTransactions(data.transactions || []);
      if (data.stats) setStats(data.stats);
      setUsingDemo(false);
    } catch {
      // Fallback to demo data for presentation
      let filtered = [...DEMO_TRANSACTIONS];
      if (gatewayFilter !== 'ALL') filtered = filtered.filter(t => t.paymentMethod === gatewayFilter.toLowerCase());
      if (statusFilter !== 'ALL') filtered = filtered.filter(t => t.status === statusFilter);
      if (search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter(t =>
          t.phone.includes(s) || t.username.toLowerCase().includes(s) || t.paymentIdentifier.toLowerCase().includes(s)
        );
      }
      setTransactions(filtered);
      // Compute demo stats
      const all = DEMO_TRANSACTIONS;
      setStats({
        totalRevenueBDT: all.filter(t => t.status === 'VERIFIED').reduce((s, t) => s + t.amount, 0),
        pendingCount: all.filter(t => t.status === 'PENDING_AUDIT').length,
        verifiedCount: all.filter(t => t.status === 'VERIFIED').length,
        flaggedCount: all.filter(t => t.status === 'FLAGGED').length,
      });
      setUsingDemo(true);
    }
    setLoading(false);
  }, [search, statusFilter, gatewayFilter]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  // ---- AUDIT ACTION ----
  const handleAuditAction = async (txId, newStatus) => {
    if (!auditNotes.trim() && newStatus === 'FLAGGED') {
      showToast('Please add audit notes when flagging a transaction.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/transactions/auditor/verify/${txId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, auditedBy: user?.username || 'Control Manager', auditNotes }),
      });
      if (!res.ok) throw new Error('API failed');
      await res.json();
      showToast(`Transaction ${newStatus === 'VERIFIED' ? '✅ Verified' : '🚩 Flagged'} successfully.`);
    } catch {
      // Demo mode: update local state
      setTransactions(prev => prev.map(t =>
        t._id === txId ? { ...t, status: newStatus, auditedBy: user?.username || 'Control Manager', auditedAt: new Date().toISOString(), auditNotes } : t
      ));
      showToast(`Transaction ${newStatus === 'VERIFIED' ? '✅ Verified' : '🚩 Flagged'} (demo mode).`);
    }
    setSelectedTx(null);
    setAuditNotes('');
    setActionLoading(false);
    loadTransactions();
  };

  // ---- COPY TRX ID ----
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  // ---- CSV EXPORT ----
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch(`${API}/api/transactions/auditor/export`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `utilix_audit_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 Audit CSV exported successfully.');
    } catch {
      // Demo CSV export
      const headers = ['Transaction ID', 'Username', 'Phone', 'Amount', 'Currency', 'Gateway', 'Payment Identifier', 'Status', 'Audited By', 'Audited At', 'Audit Notes', 'Created At'];
      const rows = DEMO_TRANSACTIONS.map(t => [
        t._id, t.username, t.phone, t.amount, t.currency, t.paymentMethod, t.paymentIdentifier, t.status,
        t.auditedBy || '', t.auditedAt || '', `"${t.auditNotes}"`, t.createdAt
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `utilix_audit_demo_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 Demo audit CSV exported.');
    }
    setExportLoading(false);
  };

  // ---- STYLES ----
  const s = {
    container: {
      width: '100%',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: '#e2e8f0',
      minHeight: '100vh',
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
    },
    title: {
      fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px',
      background: 'linear-gradient(90deg, #22d3ee, #818cf8)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    demoBadge: {
      fontSize: '10px', fontWeight: 700, padding: '3px 8px',
      background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
      color: '#f59e0b', borderRadius: '6px', letterSpacing: '0.08em',
    },
    headerActions: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    exportBtn: {
      padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
      background: 'linear-gradient(135deg, #22d3ee, #818cf8)', color: '#0f172a',
      fontWeight: 800, fontSize: '12px', letterSpacing: '0.05em', transition: 'opacity 0.2s',
    },
    maskToggle: {
      padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
      background: phoneMasked ? 'rgba(34,211,238,0.15)' : 'rgba(100,116,139,0.2)',
      border: phoneMasked ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(100,116,139,0.3)',
      color: phoneMasked ? '#22d3ee' : '#94a3b8', fontWeight: 700, fontSize: '12px', transition: 'all 0.2s',
    },
    // KPI cards
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' },
    kpiCard: (accent) => ({
      background: 'rgba(15,23,42,0.7)', border: `1px solid ${accent}33`,
      borderRadius: '14px', padding: '16px', textAlign: 'center',
      boxShadow: `0 0 20px ${accent}11`,
    }),
    kpiValue: (accent) => ({ fontSize: '24px', fontWeight: 900, color: accent, lineHeight: 1 }),
    kpiLabel: { fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '6px' },
    // Filters
    filterBar: {
      display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap',
    },
    searchInput: {
      flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '10px',
      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.8)',
      color: '#e2e8f0', fontSize: '13px', outline: 'none',
    },
    filterBtn: (active) => ({
      padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', transition: 'all 0.15s',
      background: active ? 'rgba(34,211,238,0.2)' : 'rgba(30,41,59,0.8)',
      color: active ? '#22d3ee' : '#64748b',
      borderColor: active ? 'rgba(34,211,238,0.4)' : 'transparent',
      borderStyle: 'solid', borderWidth: '1px',
    }),
    // Table
    tableWrap: {
      background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)',
      borderRadius: '16px', overflow: 'hidden',
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: {
      padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: '10px',
      textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569',
      borderBottom: '1px solid rgba(51,65,85,0.5)', background: 'rgba(15,23,42,0.8)',
    },
    td: {
      padding: '13px 16px', borderBottom: '1px solid rgba(30,41,59,0.5)',
      verticalAlign: 'middle',
    },
    // Status badge
    statusBadge: (st) => ({
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
      background: STATUS_CONFIG[st]?.bg || 'rgba(100,116,139,0.1)',
      color: STATUS_CONFIG[st]?.color || '#64748b',
      border: `1px solid ${STATUS_CONFIG[st]?.border || 'rgba(100,116,139,0.2)'}`,
    }),
    // Gateway badge
    gwBadge: (gw) => ({
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
      background: gw === 'bkash' ? 'rgba(228,0,118,0.12)' : 'rgba(99,91,255,0.12)',
      color: gw === 'bkash' ? '#e40076' : '#818cf8',
      border: `1px solid ${gw === 'bkash' ? 'rgba(228,0,118,0.25)' : 'rgba(99,91,255,0.25)'}`,
    }),
    // Action buttons
    verifyBtn: {
      padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
      background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, fontSize: '11px',
      transition: 'background 0.15s',
    },
    flagBtn: {
      padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
      background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, fontSize: '11px',
      transition: 'background 0.15s',
    },
    copyBtn: {
      padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(51,65,85,0.5)',
      cursor: 'pointer', background: 'transparent', color: '#94a3b8', fontSize: '10px',
      fontWeight: 600, transition: 'all 0.15s',
    },
    // Modal overlay
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px',
    },
    modal: {
      background: 'linear-gradient(145deg, #0f172a, #1e293b)',
      border: '1px solid rgba(51,65,85,0.8)', borderRadius: '20px',
      padding: '28px', width: '100%', maxWidth: '520px',
      boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
    },
    // Toast
    toastStyle: (type) => ({
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999,
      padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '13px',
      background: type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(34,197,94,0.95)',
      color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slideIn 0.3s ease',
    }),
  };

  // ---- RENDER ----
  return (
    <div style={s.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #334155; }
        tr:hover td { background: rgba(30,41,59,0.4); }
      `}</style>

      {/* Toast Notification */}
      {toast && <div style={s.toastStyle(toast.type)}>{toast.msg}</div>}

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={s.title}>💰 Transaction Auditor</span>
            {usingDemo && <span style={s.demoBadge}>DEMO MODE</span>}
          </div>
          <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            Control Manager · Premium Alert Subscription Payment Verification
          </p>
        </div>
        <div style={s.headerActions}>
          <button
            style={s.maskToggle}
            onClick={() => setPhoneMasked(p => !p)}
          >
            {phoneMasked ? '🔒 Phone Masked' : '👁 Phone Visible'}
          </button>
          <button
            style={{ ...s.exportBtn, opacity: exportLoading ? 0.6 : 1 }}
            onClick={handleExport}
            disabled={exportLoading}
          >
            {exportLoading ? '⏳ Exporting...' : '📥 Export CSV'}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={s.kpiGrid}>
        <div style={s.kpiCard('#22d3ee')}>
          <p style={s.kpiValue('#22d3ee')}>৳{stats.totalRevenueBDT.toFixed(0)}</p>
          <p style={s.kpiLabel}>Total Revenue (BDT)</p>
        </div>
        <div style={s.kpiCard('#22c55e')}>
          <p style={s.kpiValue('#22c55e')}>{stats.verifiedCount}</p>
          <p style={s.kpiLabel}>Verified</p>
        </div>
        <div style={s.kpiCard('#f59e0b')}>
          <p style={s.kpiValue('#f59e0b')}>{stats.pendingCount}</p>
          <p style={s.kpiLabel}>Pending Audit</p>
        </div>
        <div style={s.kpiCard('#ef4444')}>
          <p style={s.kpiValue('#ef4444')}>{stats.flaggedCount}</p>
          <p style={s.kpiLabel}>Flagged</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={s.filterBar}>
        <input
          style={s.searchInput}
          placeholder="🔍  Search by phone, username, or TrxID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'bkash'].map(g => (
            <button key={g} style={s.filterBtn(gatewayFilter === g)} onClick={() => setGatewayFilter(g)}>
              {g === 'bkash' ? '📱 bKash' : 'All Gateways'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING_AUDIT', 'VERIFIED', 'FLAGGED'].map(st => (
            <button key={st} style={s.filterBtn(statusFilter === st)} onClick={() => setStatusFilter(st)}>
              {st === 'ALL' ? 'All Status' : STATUS_CONFIG[st]?.icon + ' ' + STATUS_CONFIG[st]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #22d3ee', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#334155' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</p>
            <p style={{ fontWeight: 700 }}>No transactions found</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Subscriber', 'Phone', 'Amount', 'Gateway', 'TrxID', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{tx.username}</div>
                      {tx.isSandbox && <span style={{ fontSize: '9px', color: '#f59e0b', fontWeight: 700 }}>SANDBOX</span>}
                    </td>
                    <td style={s.td}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8' }}>
                        {phoneMasked ? maskPhone(tx.phone) : tx.phone}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={{ fontWeight: 800, color: tx.currency === 'BDT' ? '#e40076' : '#818cf8' }}>
                        {tx.currency === 'BDT' ? '৳' : '$'}{tx.amount.toFixed(tx.currency === 'USD' ? 2 : 0)}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.gwBadge(tx.paymentMethod)}>
                        {GATEWAY_CONFIG[tx.paymentMethod]?.icon} {GATEWAY_CONFIG[tx.paymentMethod]?.label}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.paymentIdentifier}
                        </span>
                        <button
                          style={{ ...s.copyBtn, color: copied === tx.paymentIdentifier ? '#22c55e' : '#94a3b8' }}
                          onClick={() => copyToClipboard(tx.paymentIdentifier)}
                        >
                          {copied === tx.paymentIdentifier ? '✓' : '⧉'}
                        </button>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={s.statusBadge(tx.status)}>
                        {STATUS_CONFIG[tx.status]?.icon} {STATUS_CONFIG[tx.status]?.label}
                      </span>
                      {tx.auditedBy && (
                        <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px' }}>by {tx.auditedBy}</div>
                      )}
                    </td>
                    <td style={s.td}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>{formatDate(tx.createdAt)}</span>
                    </td>
                    <td style={s.td}>
                      {tx.status === 'PENDING_AUDIT' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={s.verifyBtn} onClick={() => { setSelectedTx(tx); setAuditNotes(''); }}>✅ Verify</button>
                          <button style={s.flagBtn} onClick={() => { setSelectedTx({ ...tx, _preFlag: true }); setAuditNotes(''); }}>🚩 Flag</button>
                        </div>
                      ) : (
                        <button
                          style={{ ...s.copyBtn, fontSize: '11px' }}
                          onClick={() => { setSelectedTx(tx); setAuditNotes(tx.auditNotes || ''); }}
                        >
                          📋 Notes
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Modal */}
      {selectedTx && (
        <div style={s.overlay} onClick={() => setSelectedTx(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '4px', color: '#f1f5f9' }}>
              {selectedTx.status !== 'PENDING_AUDIT' ? '📋 Audit Record' : (selectedTx._preFlag ? '🚩 Flag Transaction' : '✅ Verify Transaction')}
            </h3>
            <p style={{ fontSize: '12px', color: '#475569', marginBottom: '20px' }}>
              {selectedTx.username} · {phoneMasked ? maskPhone(selectedTx.phone) : selectedTx.phone}
            </p>

            {/* Transaction Details */}
            <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: '12px', padding: '16px', marginBottom: '18px', fontSize: '13px' }}>
              {[
                ['Gateway', `${GATEWAY_CONFIG[selectedTx.paymentMethod]?.icon} ${GATEWAY_CONFIG[selectedTx.paymentMethod]?.label}`],
                ['Amount', `${selectedTx.currency === 'BDT' ? '৳' : '$'}${selectedTx.amount.toFixed(selectedTx.currency === 'USD' ? 2 : 0)} ${selectedTx.currency}`],
                ['Payment ID', selectedTx.paymentIdentifier],
                ['Plan', selectedTx.subscriptionPlan],
                ['Submitted', formatDate(selectedTx.createdAt)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>{label}</span>
                  <span style={{ color: '#e2e8f0', fontFamily: label === 'Payment ID' ? 'monospace' : 'inherit', fontSize: label === 'Payment ID' ? '11px' : '13px' }}>{value}</span>
                </div>
              ))}
              {selectedTx.auditedBy && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Audited By</span>
                  <span style={{ color: '#22d3ee' }}>{selectedTx.auditedBy} · {formatDate(selectedTx.auditedAt)}</span>
                </div>
              )}
            </div>

            {/* Audit Notes */}
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Audit Notes {selectedTx._preFlag && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <textarea
              value={auditNotes}
              onChange={e => setAuditNotes(e.target.value)}
              placeholder={selectedTx._preFlag ? 'Reason for flagging this transaction...' : 'Optional verification notes...'}
              disabled={selectedTx.status !== 'PENDING_AUDIT'}
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px', resize: 'none',
                background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.6)',
                color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                opacity: selectedTx.status !== 'PENDING_AUDIT' ? 0.5 : 1,
              }}
            />

            {/* Action Buttons */}
            {selectedTx.status === 'PENDING_AUDIT' && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button
                  style={{ ...s.verifyBtn, flex: 1, padding: '10px', fontSize: '13px', opacity: actionLoading ? 0.6 : 1 }}
                  disabled={actionLoading}
                  onClick={() => handleAuditAction(selectedTx._id, selectedTx._preFlag ? 'FLAGGED' : 'VERIFIED')}
                >
                  {actionLoading ? '⏳ Processing...' : (selectedTx._preFlag ? '🚩 Confirm Flag' : '✅ Stamp Verified')}
                </button>
                <button
                  style={{ ...s.copyBtn, padding: '10px 18px', fontSize: '13px' }}
                  onClick={() => setSelectedTx(null)}
                >
                  Cancel
                </button>
              </div>
            )}
            {selectedTx.status !== 'PENDING_AUDIT' && (
              <button
                style={{ ...s.copyBtn, width: '100%', padding: '10px', marginTop: '16px', fontSize: '13px' }}
                onClick={() => setSelectedTx(null)}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Turan End
