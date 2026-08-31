import React from 'react';

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  ASSIGNED: '#0ea5e9',
  RESOLVED: '#22c55e',
  REPORTED: '#f59e0b',
};

function IncidentPanel({ selectedIncident, setSelectedIncident, technicians, selectedTechId, setSelectedTechId, onAssign, onDelete }) {
  if (!selectedIncident) {
    return <p className="text-xs text-slate-500">Click a pin on the map to view details and assign a technician.</p>;
  }

  //Nusfat: Grey out OFF_DUTY technicians in dropdown
const techOptions = [];
for (let i = 0; i < technicians.length; i++) {
  const t = technicians[i];
  const isOffDuty = t.status === 'OFF_DUTY';
  techOptions.push(
    <option 
      key={t._id} 
      value={t._id}
      disabled={isOffDuty}
      style={{ color: isOffDuty ? '#4b5563' : 'white' }}
    >
      {t.username} ({t.name}) {isOffDuty ? '— OFF DUTY' : ''}
    </option>
  );
}
//Nusfat End

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-black text-cyan-400 uppercase">Incident Detail</h4>
      
      <div className="space-y-2">
        <p className="text-xs"><strong>Type:</strong> {selectedIncident.utilityType}</p>
        <p className="text-xs"><strong>Location:</strong> {selectedIncident.locationName}</p>
        <p className="text-xs"><strong>Reported By:</strong> {selectedIncident.reporterName}</p>
        <p className="text-xs"><strong>Status:</strong>{' '}<span style={{ color: STATUS_COLORS[selectedIncident.status] || '#aaa' }}>{selectedIncident.status}</span></p>
        {selectedIncident.assignedToName && <p className="text-xs"><strong>Assigned To:</strong> {selectedIncident.assignedToName}</p>}
        <p className="text-xs italic bg-slate-950 p-3 border border-slate-800 rounded">"{selectedIncident.description}"</p>
      </div>

      {selectedIncident.status !== 'RESOLVED' && (
        <div className="pt-2 border-t border-slate-800">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">
            {selectedIncident.assignedToName ? 'Change Assigned Technician' : 'Assign Technician'}
          </h5>
          
          {technicians.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No technicians registered.</p>
          ) : (
            <>
              <select 
                value={selectedTechId} 
                onChange={(e) => setSelectedTechId(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-700 p-2 mb-3 text-xs rounded text-white"
              >
                <option value="">— Select Technician —</option>
                {techOptions}
              </select>
              <button 
                onClick={onAssign} 
                className="w-full py-2 bg-cyan-600 text-xs font-bold rounded hover:bg-cyan-500"
              >
                {selectedIncident.assignedToName ? 'REASSIGN TECHNICIAN' : 'ASSIGN & SET ASSIGNED'}
              </button>
            </>
          )}
        </div>
      )}

      {selectedIncident.status === 'RESOLVED' && (
        <p className="text-xs text-green-400 font-bold text-center py-2 border-t border-slate-800 pt-4">
          ✓ This task has been resolved.
        </p>
      )}

      <button onClick={() => onDelete(selectedIncident._id)} className="w-full py-2 bg-red-900/40 text-red-400 text-xs font-bold rounded hover:bg-red-900">DELETE REPORT</button>
      <button onClick={() => setSelectedIncident(null)} className="w-full py-2 bg-slate-800 text-xs font-bold rounded hover:bg-slate-700">CLOSE</button>
    </div>
  );
}

export default IncidentPanel;