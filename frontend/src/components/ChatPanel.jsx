// Turan: Resident-Technician Chat Panel Component (Chat Feature)
import React, { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:5000';

// --- CHAT PANEL COMPONENT ---
// A self-contained, real-time polling chat panel.
// Props:
//   outageId    - The ID of the outage/task this chat is tied to
//   currentUser - The logged-in user object { id, username, role }
//   otherName   - Display name of the other participant (e.g. technician name)
function ChatPanel({ outageId, currentUser, otherName }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Normalize role: map 'admin', 'warehouse' etc. to 'resident' for schema compat
  const normalizedRole = currentUser?.role === 'technician' ? 'technician' : 'resident';

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/api/chat/${outageId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);
    } catch {
      // silently fail on poll errors
    }
  };

  useEffect(() => {
    if (!outageId) return;
    fetchMessages();
    // Poll every 3 seconds for new messages
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [outageId]);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/chat/${outageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId:   currentUser.id || currentUser._id,
          senderName: currentUser.username || currentUser.name,
          senderRole: normalizedRole,
          message:    trimmed,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to send message.');
        return;
      }

      setInputValue('');
      await fetchMessages();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerAvatar}>
          {normalizedRole === 'technician' ? '👤' : '🔧'}
        </div>
        <div>
          <div style={styles.headerTitle}>
            {normalizedRole === 'technician' ? 'Chat with Resident' : 'Chat with Technician'}
          </div>
          <div style={styles.headerSub}>
            {otherName || 'Other party'} · Incident #{outageId?.slice(-6).toUpperCase()}
          </div>
        </div>
        <div style={styles.livePill}>
          <span style={styles.liveDot} />
          LIVE
        </div>
      </div>

      {/* Messages area */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyText}>No messages yet.</p>
            <p style={styles.emptySubText}>Be the first to send a message about this incident.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === (currentUser.id || currentUser._id);
            return (
              <div
                key={msg._id}
                style={{
                  ...styles.messageRow,
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                {!isMe && (
                  <div style={styles.avatarCircle}>
                    {msg.senderRole === 'technician' ? '🔧' : '👤'}
                  </div>
                )}
                <div>
                  {!isMe && (
                    <div style={styles.senderLabel}>{msg.senderName}</div>
                  )}
                  <div
                    style={{
                      ...styles.bubble,
                      ...(isMe ? styles.bubbleMe : styles.bubbleThem),
                    }}
                  >
                    {msg.message}
                  </div>
                  <div
                    style={{
                      ...styles.timestamp,
                      textAlign: isMe ? 'right' : 'left',
                    }}
                  >
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
                {isMe && (
                  <div style={styles.avatarCircle}>
                    {normalizedRole === 'technician' ? '🔧' : '👤'}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && <div style={styles.errorBar}>{error}</div>}

      {/* Input area */}
      <div style={styles.inputArea}>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={2}
          style={styles.textarea}
        />
        <button
          onClick={handleSend}
          disabled={isSending || !inputValue.trim()}
          style={{
            ...styles.sendBtn,
            opacity: isSending || !inputValue.trim() ? 0.5 : 1,
            cursor:  isSending || !inputValue.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {isSending ? '…' : '➤'}
        </button>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '420px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(99,102,241,0.3)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    marginTop: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
    borderBottom: '1px solid rgba(99,102,241,0.2)',
  },
  headerAvatar: {
    fontSize: '22px',
    background: 'rgba(99,102,241,0.2)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#e2e8f0',
    fontWeight: 700,
    fontSize: '14px',
  },
  headerSub: {
    color: '#64748b',
    fontSize: '11px',
    marginTop: '2px',
  },
  livePill: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: '12px',
    padding: '3px 10px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#22c55e',
    letterSpacing: '0.08em',
  },
  liveDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 1.5s infinite',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    textAlign: 'center',
    marginTop: '40px',
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  emptyText: {
    fontWeight: 600,
    color: '#64748b',
    margin: '0 0 6px',
  },
  emptySubText: {
    fontSize: '12px',
    color: '#475569',
    margin: 0,
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  avatarCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    flexShrink: 0,
  },
  senderLabel: {
    fontSize: '10px',
    color: '#6366f1',
    fontWeight: 600,
    marginBottom: '3px',
    paddingLeft: '4px',
  },
  bubble: {
    maxWidth: '240px',
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '13px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  bubbleMe: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  bubbleThem: {
    background: '#1e293b',
    border: '1px solid rgba(99,102,241,0.2)',
    color: '#cbd5e1',
    borderBottomLeftRadius: '4px',
  },
  timestamp: {
    fontSize: '10px',
    color: '#475569',
    marginTop: '4px',
    paddingLeft: '4px',
    paddingRight: '4px',
  },
  errorBar: {
    background: 'rgba(239,68,68,0.15)',
    borderTop: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171',
    fontSize: '12px',
    padding: '8px 16px',
    textAlign: 'center',
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    background: 'rgba(15,23,42,0.8)',
    borderTop: '1px solid rgba(99,102,241,0.15)',
  },
  textarea: {
    flex: 1,
    resize: 'none',
    background: '#1e293b',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: '10px',
    color: '#e2e8f0',
    fontSize: '13px',
    padding: '8px 12px',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '18px',
    padding: '0 16px',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
    flexShrink: 0,
    alignSelf: 'flex-end',
    height: '40px',
  },
};

export default ChatPanel;
// Turan End
