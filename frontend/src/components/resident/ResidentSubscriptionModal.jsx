// Turan: Resident Subscription Modal - Stripe & bKash Premium Alert Payment UI

import React, { useState } from 'react';

const API = 'http://localhost:5000';
const PLAN_PRICE_BDT = 150;
const BKASH_MERCHANT = '01XXXXXXXXX'; // Placeholder merchant number

export default function ResidentSubscriptionModal({ user, onClose, onSuccess }) {
  const [trxId, setTrxId] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [isSandbox, setIsSandbox] = useState(false);

  const handleBkashSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) { setError('Please enter your Phone Number.'); return; }
    if (!trxId.trim()) { setError('Please enter your bKash Transaction ID.'); return; }
    if (!isSandbox && !/^[A-Z0-9]{10}$/i.test(trxId.trim())) {
      setError('Invalid bKash TrxID. Must be 10 alphanumeric characters (e.g. 8N7A6W5X9Y).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/transactions/bkash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || user?._id,
          username: user?.username || 'resident',
          phone: phone.trim(),
          amount: PLAN_PRICE_BDT,
          trxId: trxId.trim().toUpperCase(),
          isSandbox,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed.'); setLoading(false); return; }
      setResult(data);
      setStep('success');
      if (onSuccess) onSuccess();
    } catch {
      // Demo mode
      setResult({ trxId: trxId.trim().toUpperCase(), message: 'Demo submission recorded. Pending audit.' });
      setStep('success');
    }
    setLoading(false);
  };



  const s = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px',
    },
    modal: {
      background: 'linear-gradient(145deg, #0f172a, #1e293b)',
      border: '1px solid rgba(51,65,85,0.8)', borderRadius: '24px',
      padding: '32px', width: '100%', maxWidth: '460px',
      boxShadow: '0 30px 80px rgba(0,0,0,0.6)', fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: '#e2e8f0',
    },
    title: {
      fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px',
      background: 'linear-gradient(90deg, #22d3ee, #818cf8)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px',
    },
    planCard: {
      background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(34,211,238,0.2)',
      borderRadius: '14px', padding: '16px', marginBottom: '24px',
    },
    gwCard: (active, color) => ({
      flex: 1, padding: '18px', borderRadius: '14px', cursor: 'pointer', textAlign: 'center',
      border: active ? `2px solid ${color}` : '2px solid rgba(51,65,85,0.5)',
      background: active ? `${color}15` : 'rgba(15,23,42,0.6)', transition: 'all 0.2s',
    }),
    input: {
      width: '100%', padding: '12px 14px', borderRadius: '10px', outline: 'none',
      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.7)',
      color: '#e2e8f0', fontSize: '14px', boxSizing: 'border-box', letterSpacing: '0.05em',
    },
    primaryBtn: (color1, color2) => ({
      width: '100%', padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer',
      background: `linear-gradient(135deg, ${color1}, ${color2})`,
      color: '#fff', fontWeight: 800, fontSize: '14px', marginTop: '16px', transition: 'opacity 0.2s',
    }),
    backBtn: {
      background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer',
      fontSize: '12px', fontWeight: 600, padding: '4px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px',
    },
    errorBox: {
      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '10px', padding: '10px 14px', color: '#ef4444', fontSize: '12px',
      fontWeight: 600, marginTop: '12px',
    },
  };



  // ---- STEP: BKASH ----
  if (!result) return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <p style={s.title}>⚡ Premium Alerts - bKash</p>
            <p style={{ fontSize: '12px', color: '#475569', marginBottom: '20px' }}>Subscribe to instant utility outage SMS & push notifications</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ background: 'rgba(228,0,118,0.08)', border: '1px solid rgba(228,0,118,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#e40076', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Payment Instructions</p>
          <ol style={{ fontSize: '12px', color: '#94a3b8', paddingLeft: '16px', lineHeight: '2' }}>
            <li>Open bKash app → <strong style={{ color: '#e2e8f0' }}>Send Money</strong></li>
            <li>Send <strong style={{ color: '#e40076' }}>৳{PLAN_PRICE_BDT}</strong> to merchant: <strong style={{ color: '#22d3ee', letterSpacing: '0.05em' }}>{BKASH_MERCHANT}</strong></li>
            <li>Copy the 10-character <strong style={{ color: '#e2e8f0' }}>TrxID</strong> from confirmation SMS</li>
            <li>Paste it below and submit</li>
          </ol>
        </div>

        <form onSubmit={handleBkashSubmit}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
            Phone Number
          </label>
          <input
            style={{...s.input, marginBottom: '16px'}}
            placeholder="e.g. +8801711234567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />

          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
            bKash Transaction ID (TrxID)
          </label>
          <input
            style={s.input}
            placeholder="e.g. 8N7A6W5X9Y"
            value={trxId}
            onChange={e => setTrxId(e.target.value.toUpperCase())}
            maxLength={10}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer' }} onClick={() => setIsSandbox(p => !p)}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: isSandbox ? '#f59e0b' : 'transparent', border: '2px solid rgba(100,116,139,0.6)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isSandbox && <span style={{ fontSize: '10px', color: '#0f172a', fontWeight: 900 }}>✓</span>}
            </div>
            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>Demo / Sandbox Mode (skip TrxID validation)</span>
          </div>
          {error && <div style={s.errorBox}>⚠ {error}</div>}
          <button style={{ ...s.primaryBtn('#e40076', '#be185d'), opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? '⏳ Submitting...' : '📤 Submit bKash Payment'}
          </button>
        </form>
      </div>
    </div>
  );



  // ---- STEP: SUCCESS ----
  if (result) return (
    <div style={s.overlay}>
      <div style={{ ...s.modal, textAlign: 'center' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
        <p style={{ ...s.title, fontSize: '22px', display: 'block', textAlign: 'center' }}>Payment Submitted!</p>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '8px 0 20px' }}>
          Your payment is now <strong style={{ color: '#f59e0b' }}>PENDING AUDIT</strong> by the Control Manager.<br />
          You'll receive confirmation once verified.
        </p>
        {result && (
          <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: '12px', padding: '14px', marginBottom: '20px', fontSize: '12px', textAlign: 'left' }}>
            {result.trxId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#475569' }}>bKash TrxID</span>
                <span style={{ fontFamily: 'monospace', color: '#e40076', fontWeight: 700 }}>{result.trxId}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Status</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>⏳ Pending Audit</span>
            </div>
          </div>
        )}
        <button style={s.primaryBtn('#22d3ee', '#818cf8')} onClick={onClose}>✓ Done</button>
      </div>
    </div>
  );

  return null;
}

// Turan End
