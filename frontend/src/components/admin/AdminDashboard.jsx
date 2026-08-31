import React, { useState, useEffect } from 'react';
import VerificationIDsPanel from './VerificationIDsPanel';
import { PreviewMap, AdminFullMap } from './AdminMaps';
import IncidentPanel from './IncidentPanel';
import BannerPublisher from './BannerPublisher';
import ManagerComplaints from './ManagerComplaints';
import AdminFaq from './AdminFaq';
//Turan: Transaction Auditor Import
import TransactionAuditor from './TransactionAuditor';
//Turan End

const API = 'http://localhost:5000';

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  ASSIGNED: '#0ea5e9',
  RESOLVED: '#22c55e',
  REPORTED: '#f59e0b',
};

function AdminDashboard({ user, onLogout }) {
  const [outages, setOutages] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedTechId, setSelectedTechId] = useState('');
  const [showFullMap, setShowFullMap] = useState(false);

  const fetchOutages = () => {
    fetch(`${API}/api/outages/all`)
      .then((res) => res.json())
      .then((data) => setOutages(data))
      .catch((err) => console.error('Outage fetch error:', err));
  };

  const fetchTechnicians = () => {
    fetch(`${API}/api/users/technicians`)
      .then((res) => res.json())
      .then((data) => setTechnicians(data))
      .catch((err) => console.error('Technician fetch error:', err));
  };

  useEffect(() => {
    fetchOutages();
    fetchTechnicians();
  }, []);

  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
    setSelectedTechId(incident.assignedTo || '');
  };

  const handleAssign = () => {
    if (!selectedIncident || !selectedTechId) {
      alert('Please select a report and a technician.');
      return;
    }
    //Nusfat: Prevent assigning OFF_DUTY technician
    let selectedTech = null;
    for (let i = 0; i < technicians.length; i++) {
      if (technicians[i]._id === selectedTechId) {
        selectedTech = technicians[i];
        break;
      }
    }
    if (selectedTech && selectedTech.status === 'OFF_DUTY') {
      alert('This technician is OFF DUTY. Please select an ON DUTY technician.');
      return;
    }
    //Nusfat End

    let tech = null;
    for (let i = 0; i < technicians.length; i++) {
      if (technicians[i]._id === selectedTechId) {
        tech = technicians[i];
        break;
      }
    }

    if (!tech) return;

    fetch(`${API}/api/outages/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outageId: selectedIncident._id,
        technicianId: tech._id,
        technicianName: tech.username,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert(`Assigned to ${tech.username} successfully.`);
        setSelectedIncident(null);
        setSelectedTechId('');
        fetchOutages();
      })
      .catch((err) => console.error('Assign error:', err));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this report permanently?')) return;

    fetch(`${API}/api/outages/admin/delete/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => {
        alert('Report deleted.');
        setSelectedIncident(null);
        fetchOutages();
      })
      .catch((err) => console.error('Delete error:', err));
  };

  // Filter outages with clean for loops
  const filteredOutages = [];
  for (let i = 0; i < outages.length; i++) {
    if (filterStatus === 'ALL' || outages[i].status === filterStatus) {
      filteredOutages.push(outages[i]);
    }
  }

  // Calculate status statistics with clean loops
  let total = outages.length;
  let pending = 0;
  let assigned = 0;
  let resolved = 0;

  for (let i = 0; i < outages.length; i++) {
    const status = outages[i].status;
    if (status === 'PENDING' || status === 'REPORTED') {
      pending++;
    } else if (status === 'ASSIGNED') {
      assigned++;
    } else if (status === 'RESOLVED') {
      resolved++;
    }
  }

  const statBoxes = [
    { label: 'Total Reports', value: total, color: 'text-white' },
    { label: 'Pending', value: pending, color: 'text-amber-400' },
    { label: 'Assigned', value: assigned, color: 'text-cyan-400' },
    { label: 'Resolved', value: resolved, color: 'text-green-400' },
  ];

  const renderedStatBoxes = [];
  for (let i = 0; i < statBoxes.length; i++) {
    const s = statBoxes[i];
    renderedStatBoxes.push(
      <div key={s.label} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
      </div>
    );
  }

  const statusFilters = ['ALL', 'PENDING', 'REPORTED', 'ASSIGNED', 'RESOLVED'];
  const renderedFilters = [];
  for (let i = 0; i < statusFilters.length; i++) {
    const s = statusFilters[i];
    renderedFilters.push(
      <button 
        key={s} 
        onClick={() => setFilterStatus(s)} 
        className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${
          filterStatus === s ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
        }`}
      >
        {s}
      </button>
    );
  }

  const tabs = [
    { key: 'map', label: 'Map View' },
    { key: 'registry', label: 'Report Registry' },
    { key: 'verification', label: 'Verification IDs' },
    //Nusfat: Banner Publisher Tab
    { key: 'banner', label: 'Banner Publisher' },
    { key: 'faq', label: 'FAQ Manager' },
    { key: 'complaints', label: 'Bill Complaints' },
    { key: 'transactions', label: 'Transaction Auditor' },
  ];

  const renderedTabs = [];
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    renderedTabs.push(
      <button 
        key={tab.key} 
        onClick={() => setActiveTab(tab.key)} 
        className={`text-sm font-black uppercase tracking-wider transition-all ${
          activeTab === tab.key ? 'text-white border-b-2 border-cyan-500 pb-1' : 'text-slate-600 hover:text-slate-400'
        }`}
      >
        {tab.label}
      </button>
    );
  }

  const mapActiveReports = [];
  for (let i = 0; i < filteredOutages.length; i++) {
    const item = filteredOutages[i];
    mapActiveReports.push(
      <div key={item._id} className="flex justify-between items-center text-xs py-2 border-b border-slate-800 last:border-0">
        <span className="font-bold text-cyan-400">{item.utilityType}</span>
        <span className="text-slate-400">{item.locationName}</span>
        <span className="text-[10px] font-bold text-amber-400">👍 {item.upvotes || 0}</span>
        <span style={{ color: STATUS_COLORS[item.status] || '#aaa' }} className="text-[10px] font-bold">{item.status}</span>
      </div>
    );
  }

  const registryItems = [];
  for (let i = 0; i < filteredOutages.length; i++) {
    const item = filteredOutages[i];
    registryItems.push(
      <div key={item._id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-cyan-400 text-[10px] font-black uppercase tracking-wider">{item.utilityType}</span>
            <h4 className="text-base font-bold">{item.locationName}</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              👍 {item.upvotes || 0} Upvotes
            </span>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: (STATUS_COLORS[item.status] || '#aaa') + '22', color: STATUS_COLORS[item.status] || '#aaa' }}>{item.status}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 italic mb-3">"{item.description}"</p>
        <div className="flex justify-between items-center text-[10px] text-slate-500">
          <span>Reported by: <strong className="text-slate-300">{item.reporterName}</strong></span>
          {item.assignedToName && <span>Assigned to: <strong className="text-cyan-400">{item.assignedToName}</strong></span>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => { handleSelectIncident(item); setShowFullMap(true); setActiveTab('map'); }} className="flex-1 py-2 bg-slate-800 text-xs font-bold rounded hover:bg-cyan-900/40 hover:text-cyan-400">VIEW ON MAP</button>
          <button onClick={() => handleDelete(item._id)} className="flex-1 py-2 bg-red-900/30 text-red-400 text-xs font-bold rounded hover:bg-red-900/60">DELETE</button>
        </div>
      </div>
    );
  }

  const modalRegistryItems = [];
  for (let i = 0; i < filteredOutages.length; i++) {
    const item = filteredOutages[i];
    modalRegistryItems.push(
      <div key={item._id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">{item.utilityType}</span>
            <h4 className="text-lg font-bold">{item.locationName}</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              👍 {item.upvotes || 0} Upvotes
            </span>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: (STATUS_COLORS[item.status] || '#aaa') + '22', color: STATUS_COLORS[item.status] || '#aaa' }}>{item.status}</span>
          </div>
        </div>
        <p className="text-sm text-slate-300 mt-3 italic">"{item.description}"</p>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
          <span>Reported by: <strong className="text-slate-300">{item.reporterName}</strong></span>
          {item.assignedToName && <span>Assigned to: <strong className="text-cyan-400">{item.assignedToName}</strong></span>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => { handleSelectIncident(item); setActiveTab('map'); }} className="flex-1 py-2 bg-slate-800 text-xs font-bold rounded hover:bg-cyan-900/40 hover:text-cyan-400">VIEW ON MAP</button>
          <button onClick={() => handleDelete(item._id)} className="flex-1 py-2 bg-red-900/30 text-red-400 text-xs font-bold uppercase rounded hover:bg-red-900/60">DELETE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans flex gap-6">
      <div className="w-1/3 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-500 bg-slate-800 flex items-center justify-center text-xl font-bold">
            {(user?.username || 'A')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black">Admin Panel</h1>
            <p className="text-slate-500 text-xs">Hello {user?.username}</p>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Manager</span>
          </div>
        </div>

        <button onClick={() => setShowFullMap(true)} className="w-full py-3 bg-cyan-600 rounded-lg text-xs font-bold hover:bg-cyan-500">LAUNCH FULL INTERACTIVE MAP</button>

        <div className="grid grid-cols-2 gap-3">
          {renderedStatBoxes}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-cyan-400 uppercase mb-3">Filter by Status</h4>
          <div className="flex flex-col gap-2">
            {renderedFilters}
          </div>
        </div>

        <button onClick={onLogout} className="w-full py-3 bg-slate-800 text-xs font-bold rounded-lg hover:bg-red-900/50 hover:text-red-400 transition-all">LOGOUT</button>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
        <div className="flex gap-6 p-6 border-b border-slate-800">
          {renderedTabs}
        </div>

        {activeTab === 'map' ? (
          <div className="flex flex-col gap-4 p-6 flex-1 overflow-hidden">
            {!showFullMap && <PreviewMap outages={filteredOutages} onClick={() => setShowFullMap(true)} />}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-60 overflow-y-auto">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Active Reports</h5>
              {mapActiveReports}
            </div>
          </div>
        ) : activeTab === 'registry' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredOutages.length === 0 && <p className="text-xs text-slate-500 italic">No reports match the current filter.</p>}
            {registryItems}
          </div>
        ) : activeTab === 'banner' ? (
          //Nusfat: Banner Publisher Tab Content
          <BannerPublisher />
          
        ) : activeTab === 'faq' ? (
          <AdminFaq />
        ) : activeTab === 'complaints' ? (
          <ManagerComplaints />
        ) : activeTab === 'transactions' ? (
          <TransactionAuditor />
        ) : (
          <VerificationIDsPanel />
        )}

      </div>

      {showFullMap && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <div className="flex gap-4">
              <h2 onClick={() => setActiveTab('map')} className={`text-xl font-black cursor-pointer ${activeTab === 'map' ? 'text-white' : 'text-slate-600'}`}>Map View</h2>
              <h2 onClick={() => setActiveTab('registry')} className={`text-xl font-black cursor-pointer ${activeTab === 'registry' ? 'text-white' : 'text-slate-600'}`}>Report Registry</h2>
            </div>
            <button onClick={() => setShowFullMap(false)} className="px-4 py-2 bg-slate-800 rounded text-xs">[CLOSE]</button>
          </div>

          {activeTab === 'map' ? (
            <div className="grid grid-cols-3 gap-8 flex-1 overflow-hidden">
              <div className="col-span-2 rounded-2xl overflow-hidden border border-slate-800" style={{ minHeight: '400px' }}>
                <AdminFullMap outages={filteredOutages} selectedIncident={selectedIncident} setSelectedIncident={handleSelectIncident} />
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 overflow-y-auto">
                <IncidentPanel selectedIncident={selectedIncident} setSelectedIncident={setSelectedIncident} technicians={technicians} selectedTechId={selectedTechId} setSelectedTechId={setSelectedTechId} onAssign={handleAssign} onDelete={handleDelete} />
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4">
              {filteredOutages.length === 0 && <p className="text-xs text-slate-500 italic">No reports match the current filter.</p>}
              {modalRegistryItems}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;