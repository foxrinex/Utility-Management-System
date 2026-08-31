import React from 'react';
// Turan: Resident-Technician Chat Panel Import (Chat Feature)
import ChatPanel from '../ChatPanel';
// Turan End

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  ASSIGNED: '#0ea5e9',
  // ahnaf start
  ON_WAY: '#fb923c',
  ON_SITE: '#a855f7',
  // ahnaf end
  RESOLVED: '#22c55e',
  REPORTED: '#f59e0b',
};

// ahnaf start
const CREW_STEPS = [
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'ON_WAY',   label: 'On Way'   },
  { key: 'ON_SITE',  label: 'On Site'  },
  { key: 'RESOLVED', label: 'Resolved' },
];

const NEXT_STATUS = {
  ASSIGNED: 'ON_WAY',
  ON_WAY:   'ON_SITE',
  ON_SITE:  'RESOLVED',
};

const NEXT_LABEL = {
  ASSIGNED: '🚗 Start Journey (On Way)',
  ON_WAY:   '📍 Arrived On Site',
  ON_SITE:  '✓ Mark Resolved',
};

function CrewStepper({ status }) {
  const currentIndex = CREW_STEPS.findIndex((s) => s.key === status);

  const stepElements = [];
  for (let i = 0; i < CREW_STEPS.length; i++) {
    const step = CREW_STEPS[i];
    const isCompleted = i < currentIndex;
    const isActive = i === currentIndex;

    stepElements.push(
      <div key={step.key} className="flex flex-col items-center flex-1">
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 'bold',
            border: `2px solid ${isCompleted || isActive ? STATUS_COLORS[step.key] || '#22c55e' : '#334155'}`,
            backgroundColor: isCompleted
              ? STATUS_COLORS[step.key] || '#22c55e'
              : isActive
              ? (STATUS_COLORS[step.key] || '#0ea5e9') + '33'
              : 'transparent',
            color: isCompleted ? '#fff' : isActive ? STATUS_COLORS[step.key] || '#0ea5e9' : '#475569',
            transition: 'all 0.3s',
          }}
        >
          {isCompleted ? '✓' : i + 1}
        </div>
        <span
          style={{
            fontSize: 9,
            marginTop: 4,
            fontWeight: isActive ? 'bold' : 'normal',
            color: isActive ? STATUS_COLORS[step.key] || '#0ea5e9' : isCompleted ? '#64748b' : '#475569',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        >
          {step.label.toUpperCase()}
        </span>
      </div>
    );

    if (i < CREW_STEPS.length - 1) {
      stepElements.push(
        <div
          key={`line-${i}`}
          style={{
            flex: 1,
            height: 2,
            marginTop: 13,
            alignSelf: 'flex-start',
            backgroundColor: i < currentIndex ? '#22c55e' : '#1e293b',
            transition: 'background-color 0.3s',
          }}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 16 }}>
      {stepElements}
    </div>
  );
}
// ahnaf end


// ─── Task Detail Panel ────────────────────────────────────────────────────────
export function TaskPanel({ selectedIncident, setSelectedIncident, onMarkResolved, onUpdateStatus, currentUser }) {
  if (!selectedIncident) {
    return <p className="text-xs text-slate-500">Click a pin on the map to view task details.</p>;
  }

  // ahnaf start
  const nextStatus = NEXT_STATUS[selectedIncident.status];
  const nextLabel  = NEXT_LABEL[selectedIncident.status];
  // ahnaf end

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-black text-cyan-400 uppercase">Task Detail</h4>

      {/* ahnaf start */}
      <CrewStepper status={selectedIncident.status} />
      {/* ahnaf end */}

      <div className="space-y-2">
        <p className="text-xs"><strong>Type:</strong> {selectedIncident.utilityType}</p>
        <p className="text-xs"><strong>Location:</strong> {selectedIncident.locationName}</p>
        <p className="text-xs"><strong>Reported By:</strong> {selectedIncident.reporterName}</p>
        <p className="text-xs">
          <strong>Status:</strong>{' '}
          <span style={{ color: STATUS_COLORS[selectedIncident.status] || '#aaa' }}>
            {selectedIncident.status}
          </span>
        </p>
        <p className="text-xs italic bg-slate-950 p-3 border border-slate-800 rounded">
          "{selectedIncident.description}"
        </p>
      </div>

      {/* ahnaf start */}
      {nextStatus && nextLabel && (
        <button
          onClick={() => onUpdateStatus(selectedIncident._id, nextStatus)}
          className="w-full py-2 text-xs font-bold rounded transition-all"
          style={{
            backgroundColor: (STATUS_COLORS[nextStatus] || '#0ea5e9') + '33',
            color: STATUS_COLORS[nextStatus] || '#0ea5e9',
            border: `1px solid ${(STATUS_COLORS[nextStatus] || '#0ea5e9') + '55'}`,
          }}
        >
          {nextLabel}
        </button>
      )}
      {selectedIncident.status === 'RESOLVED' && (
        <p className="text-xs text-green-400 font-bold text-center py-2">✓ This task is resolved.</p>
      )}
      {/* ahnaf end */}

      <button
        onClick={() => setSelectedIncident(null)}
        className="w-full py-2 bg-slate-800 text-xs font-bold rounded hover:bg-slate-700"
      >
        CLOSE
      </button>

      {/* Turan: Chat with reporter — available to technician while task is active (Chat Feature) */}
      {currentUser && selectedIncident.reporterName && (
        <ChatPanel
          outageId={selectedIncident._id}
          currentUser={currentUser}
          otherName={selectedIncident.reporterName}
        />
      )}
      {/* Turan End */}
    </div>
  );
}


// ─── Task List View ───────────────────────────────────────────────────────────
export function TechTaskList({ filteredTasks, handleSelectIncident, setShowFullMap, setActiveTab, handleMarkResolved, handleUpdateStatus }) {
  if (filteredTasks.length === 0) {
    return <p className="text-xs text-slate-500 italic">No tasks match the current filter.</p>;
  }

  const renderedTaskItems = [];

  for (let i = 0; i < filteredTasks.length; i++) {
    const taskItem = filteredTasks[i];

    // ahnaf start
    const nextStatus = NEXT_STATUS[taskItem.status];
    const nextLabel  = NEXT_LABEL[taskItem.status];
    // ahnaf end

    renderedTaskItems.push(
      <div key={taskItem._id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-cyan-400 text-[10px] font-black uppercase tracking-wider">{taskItem.utilityType}</span>
            <h4 className="text-base font-bold">{taskItem.locationName}</h4>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ backgroundColor: (STATUS_COLORS[taskItem.status] || '#aaa') + '22', color: STATUS_COLORS[taskItem.status] || '#aaa' }}
          >
            {taskItem.status}
          </span>
        </div>

        {/* ahnaf start */}
        <div style={{ marginBottom: 12 }}>
          <CrewStepper status={taskItem.status} />
        </div>
        {/* ahnaf end */}

        <p className="text-xs text-slate-400 italic mb-3">"{taskItem.description}"</p>
        <p className="text-[10px] text-slate-500">Reported by: <strong className="text-slate-300">{taskItem.reporterName}</strong></p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => { handleSelectIncident(taskItem); setShowFullMap(true); setActiveTab('map'); }}
            className="flex-1 py-2 bg-slate-800 text-xs font-bold rounded hover:bg-cyan-900/40 hover:text-cyan-400"
          >
            VIEW ON MAP
          </button>
          {/* ahnaf start */}
          {nextStatus && nextLabel && (
            <button
              onClick={() => handleUpdateStatus(taskItem._id, nextStatus)}
              className="flex-1 py-2 text-xs font-bold rounded transition-all"
              style={{
                backgroundColor: (STATUS_COLORS[nextStatus] || '#0ea5e9') + '33',
                color: STATUS_COLORS[nextStatus] || '#0ea5e9',
                border: `1px solid ${(STATUS_COLORS[nextStatus] || '#0ea5e9') + '55'}`,
              }}
            >
              {nextLabel}
            </button>
          )}
          {taskItem.status === 'RESOLVED' && (
            <span className="flex-1 py-2 text-green-400 text-xs font-bold text-center">✓ Resolved</span>
          )}
          {/* ahnaf end */}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderedTaskItems}
    </div>
  );
}