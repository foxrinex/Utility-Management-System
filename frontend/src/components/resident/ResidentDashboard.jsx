import React, { useState, useEffect } from 'react';
import { PreviewMap, FullMap, isInsideBangladesh } from './ResidentMapOverview';
import { ResidentAnnouncementList } from './ResidentAnnouncementList';
import { ResidentRegistryList } from './ResidentRegistryList';
import { ResidentFAQView } from './ResidentFAQView';
import ComplaintForm from './ComplaintForm';
import TrackComplaint from './TrackComplaint';
import ChatbotPage from './ChatbotPage';
//Turan: Resident-Technician Chat Panel Import (Chat Feature)
import ChatPanel from '../ChatPanel';
//Turan End

//Turan: Resident Subscription Modal Import
import ResidentSubscriptionModal from './ResidentSubscriptionModal';
//Turan End

// ahnaf start
const STATUS_COLORS = {
  PENDING:   '#f59e0b',
  ASSIGNED: '#0ea5e9',
  ON_WAY:   '#fb923c',
  ON_SITE:  '#a855f7',
  RESOLVED: '#22c55e',
  REPORTED: '#f59e0b',
};

const STATUS_LABELS = {
  PENDING:   'Pending Review',
  ASSIGNED: 'Technician Assigned',
  ON_WAY:   'Crew On The Way 🚗',
  ON_SITE:  'Crew On Site 📍',
  RESOLVED: 'Resolved ✓',
};
// ahnaf end

function ResidentDashboard({ user, onLogout }) {
  const [outages, setOutages] = useState([]);
  // Full list (including RESOLVED) used for the Repair Registry / review flow.
  // /api/outages/active deliberately excludes RESOLVED reports, so the registry
  // needs its own fetch against /api/outages/all or resolved outages never appear.
  const [allOutages, setAllOutages] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullMap, setShowFullMap] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [activeTab, setActiveTab] = useState('map'); 
  //Turan: Subscription modal state
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/transactions/resident/${user?.id || user?._id}`);
        const data = await res.json();
        setIsSubscribed(data.hasActiveSubscription);
      } catch (err) {
        console.error('Failed to check subscription status', err);
      }
    };
    checkSubscription();
    // Poll every 10s in case admin approves it while resident is logged in
    const interval = setInterval(checkSubscription, 10000);
    return () => clearInterval(interval);
  }, [user]);
  //Turan End
  //NUSFAT: Banner state for System Announcements
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/banner/active');
        const data = await res.json();
        //NUSFAT: Map all active banners to announcement format
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data.map(b => ({ id: b._id, text: b.message })));
        } else {
          setBanners([]);
        }
      } catch {
        setBanners([]);
      }
    };
    fetchBanners();
    const interval = setInterval(fetchBanners, 30000);
    return () => clearInterval(interval);
  }, []);
//NUSFAT END

  const [profile, setProfile] = useState({
    username: user?.username || 'User',
    email: user?.email || 'user@example.com',
    address: user?.address || '123 Dhaka City, Bangladesh',
  });

  const [clickedPosition, setClickedPosition] = useState(null); 
  const [utilityType, setUtilityType] = useState('Electricity');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');

  const fetchMapMarkers = () => {
    fetch('http://localhost:5000/api/outages/active')
      .then((res) => res.json())
      .then((data) => {
        setOutages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching map vectors:', err);
        setLoading(false);
      });
  };

  // Fetches EVERY outage report, including RESOLVED ones, for the Repair Registry.
  const fetchAllOutages = () => {
    fetch('http://localhost:5000/api/outages/all')
      .then((res) => res.json())
      .then((data) => {
        setAllOutages(data);
      })
      .catch((err) => {
        console.error('Error fetching full outage registry:', err);
      });
  };

  useEffect(() => {
    fetchMapMarkers();
    fetchAllOutages();
    // ahnaf start
    const pollInterval = setInterval(() => {
      fetchMapMarkers();
      fetchAllOutages();
    }, 5000);
    return () => clearInterval(pollInterval);
    // ahnaf end
  }, []);

  const handleMapClick = (lat, lng) => {
    if (!isInsideBangladesh(lat, lng)) {
      alert('Reports can only be filed within Bangladesh.');
      return;
    }
    setClickedPosition([lat, lng]);
    setSelectedIncident(null);
    setIsReporting(true);
  };

  const handleIncidentSelect = (incident) => {
    setClickedPosition(null);
    setIsReporting(false);
    setSelectedIncident(incident);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const payload = {
      utilityType,
      locationName,
      latitude: clickedPosition[0],
      longitude: clickedPosition[1],
      description,
      estimatedRestoration: 'Pending',
      reporterId: user.id,
      reporterName: user.username,
    };

    fetch('http://localhost:5000/api/outages/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        alert('Report registered.');
        setIsReporting(false);
        setClickedPosition(null);
        fetchMapMarkers();
        fetchAllOutages();
      })
      .catch((err) => console.error('FETCH ERROR:', err));
  };

  const handleDeleteReport = (id) => {
    fetch(`http://localhost:5000/api/outages/delete/${id}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => { throw new Error(err.message || res.status); });
        }
        return res.json();
      })
      .then(() => {
        alert('Report removed.');
        setSelectedIncident(null);
        fetchMapMarkers();
        fetchAllOutages();
      })
      .catch((err) => console.error('Delete failed:', err));
  };

  const handleUpvote = (outageId) => {
    fetch(`http://localhost:5000/api/outages/upvote/${outageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((res) => res.json().then((data) => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status === 200) {
          setSelectedIncident(body.report);
          fetchMapMarkers();
          fetchAllOutages();
        } else {
          alert(body.error || 'Failed to toggle outage upvote.');
        }
      })
      .catch((err) => console.error('Upvote error:', err));
  };

  // Submits a resident's post-repair review. Uses the full backend URL (matching
  // every other fetch in this file) and syncs the updated report back into both
  // the map list and the full registry list so "Your Review" renders immediately.
  const handleSubmitReview = async (outageId, rating, comment) => {
    const res = await fetch(`http://localhost:5000/api/outages/review/${outageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, rating, comment })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit review.');

    setAllOutages((prev) =>
      prev.map((o) => (o._id === data.report._id ? data.report : o))
    );
    setOutages((prev) =>
      prev.map((o) => (o._id === data.report._id ? data.report : o))
    );
    if (selectedIncident && selectedIncident._id === data.report._id) {
      setSelectedIncident(data.report);
    }
  };

  const updateProfile = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: profile.username,
        address: profile.address,
      }),
    })
      .then((res) => {
        if (res.ok) {
          alert('Profile and address updated in database.');
        } else {
          alert('Failed to save profile.');
        }
      })
      .catch((err) => {
        console.error('Error updating profile:', err);
      });
  };

  const renderedOutageRows = [];

  for (let i = 0; i < outages.length; i++) {
    const outageItem = outages[i];
    renderedOutageRows.push(
      <div key={outageItem._id} className="flex justify-between items-center text-xs py-2 border-b border-slate-800 last:border-0">
        <div>
          <span className="font-bold text-cyan-400 mr-2">{outageItem.utilityType}</span>
          <span className="text-slate-400">{outageItem.locationName}</span>
        </div>
        {/* ahnaf start */}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: (STATUS_COLORS[outageItem.status] || '#aaa') + '22',
            color: STATUS_COLORS[outageItem.status] || '#aaa',
          }}
        >
          {STATUS_LABELS[outageItem.status] || outageItem.status}
        </span>
        {/* ahnaf end */}
        <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800/50">
          👍 {outageItem.upvotes || 0}
        </span>
      </div>
    );
  }

  const navTabs = [
    { key: 'map', label: 'Monitor' },
    { key: 'faq', label: 'FAQs & Help' },
    //NUSFAT: Complaint tabs - Module 3
    { key: 'complaint', label: 'Bill Complaint' },
    { key: 'track', label: 'Track Complaint' },
    //NUSFAT: Chatbot tab - Module 4
    { key: 'chatbot', label: 'Support Chat' },
    //NUSFAT END
    { key: 'profile', label: 'Account Settings' },
  ];

  const renderedNavTabs = [];

  for (let i = 0; i < navTabs.length; i++) {
    const tabItem = navTabs[i];
    renderedNavTabs.push(
      <button
        key={tabItem.key}
        onClick={() => setActiveTab(tabItem.key)}
        className={`w-full py-2 px-3 text-left text-xs font-bold rounded-lg transition-all ${
          activeTab === tabItem.key
            ? 'bg-cyan-600 text-white'
            : 'bg-slate-950 text-slate-400 hover:text-white'
        }`}
      >
        {tabItem.label}
      </button>
    );
  }

  const hasUpvoted = selectedIncident && selectedIncident.upvotedBy && selectedIncident.upvotedBy.includes(user.id);

  return (
    <>
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <div className="p-6 flex gap-6">
      <div className="w-1/3 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full border-2 border-cyan-500 bg-slate-800 flex items-center justify-center cursor-pointer hover:opacity-80 text-xl font-bold"
            onClick={() => setActiveTab('profile')}
          >
            {profile.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black">Operations</h1>
            <p className="text-slate-500 text-xs">Hello {profile.username}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Navigation</h4>
          {renderedNavTabs}
        </div>

        <button
          onClick={() => setShowFullMap(true)}
          className="w-full py-3 bg-cyan-600 rounded-lg text-xs font-bold hover:bg-cyan-500"
        >
          LAUNCH FULL INTERACTIVE MAP
        </button>

        {/*Turan: Premium Alerts Subscribe Button / Activated Badge*/}
        {isSubscribed ? (
          <div
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#22c55e',
              fontWeight: 800,
              fontSize: '12px',
              letterSpacing: '0.05em',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            ✅ PREMIUM ACTIVATED
          </div>
        ) : (
          <button
            onClick={() => setShowSubscribeModal(true)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #e40076, #818cf8)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '12px',
              letterSpacing: '0.05em',
              borderStyle: 'solid',
              borderWidth: '1px',
              borderColor: 'transparent',
              transition: 'opacity 0.2s',
            }}
          >
            ⚡ SUBSCRIBE TO PREMIUM ALERTS
          </button>
        )}
        {/*Turan End*/}

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex-1">
          <h4 className="text-sm font-bold text-cyan-400 mb-4 uppercase">System Announcements</h4>
          {/*NUSFAT: Pass active banners to announcements box*/}
          <ResidentAnnouncementList 
             announcements={banners} 
             dismissAnnouncement={(id) => setBanners(prev => prev.filter(b => b.id !== id))} 
          />
          {/*NUSFAT END */}
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl relative flex flex-col">
        {activeTab === 'profile' ? (
          <div className="flex-1 p-6">
            <h2 className="text-xl font-black mb-6">Account Settings</h2>
            <form onSubmit={updateProfile} className="max-w-md">
              <label className="block text-xs font-bold text-slate-500 mb-2">Username</label>
              <input disabled value={profile.username} className="w-full bg-slate-950 border p-2 mb-4 text-xs" />
              <label className="block text-xs font-bold text-slate-500 mb-2">Email</label>
              <input disabled value={profile.email} className="w-full bg-slate-950 border p-2 mb-4 text-xs" />
              <label className="block text-xs font-bold text-slate-500 mb-2">Residential Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full bg-slate-950 border p-2 mb-4 text-xs h-20"
              />
              <button type="submit" className="w-full py-2 bg-cyan-600 text-xs font-bold rounded">
                SAVE CHANGES
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className="w-full mt-2 py-2 bg-slate-800 text-xs font-bold rounded"
              >
                CANCEL
              </button>
            </form>
          </div>
        
        //NUSFAT: Chatbot tab content - Module 4
        ) : activeTab === 'chatbot' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatbotPage user={user} />
          </div>
        
        //NUSFAT: Complaint tab content - Module 3
        ) : activeTab === 'complaint' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <ComplaintForm />
          </div>
        ) : activeTab === 'track' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <TrackComplaint />
          </div>
        //NUSFAT END
        
        ) : activeTab === 'faq' ? (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-bold">Frequently Asked Questions</h3>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-slate-800 text-xs font-bold rounded-lg hover:bg-red-900/50"
              >
                Logout
              </button>
            </div>
            <ResidentFAQView />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-bold">System Monitor</h3>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-slate-800 text-xs font-bold rounded-lg hover:bg-red-900/50"
              >
                Logout
              </button>
            </div>

            {!showFullMap && activeTab === 'map' && (
              <div className="flex flex-col gap-4">
                <PreviewMap outages={outages} onClick={() => setShowFullMap(true)} />
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-60 overflow-y-auto">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Active Reports</h5>
                  {renderedOutageRows}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showFullMap && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <div className="flex gap-4">
              <h2
                onClick={() => setActiveTab('map')}
                className={`text-xl font-black cursor-pointer ${activeTab === 'map' ? 'text-white' : 'text-slate-600'}`}
              >
                Map View
              </h2>
              <h2
                onClick={() => setActiveTab('registry')}
                className={`text-xl font-black cursor-pointer ${activeTab === 'registry' ? 'text-white' : 'text-slate-600'}`}
              >
                Repair Registry
              </h2>
              <h2
                onClick={() => setActiveTab('faq')}
                className={`text-xl font-black cursor-pointer ${activeTab === 'faq' ? 'text-white' : 'text-slate-600'}`}
              >
                FAQs & Help
              </h2>
            </div>
            <button 
              onClick={() => {
                setShowFullMap(false);
                setActiveTab('map'); 
              }} 
              className="px-4 py-2 bg-slate-800 rounded text-xs"
            >
              [CLOSE]
            </button>
          </div>

          {activeTab === 'map' ? (
            <div className="grid grid-cols-3 gap-8 flex-1 overflow-hidden">
              <div className="col-span-2 rounded-2xl overflow-hidden border border-slate-800" style={{ minHeight: '400px' }}>
                <FullMap
                  outages={outages}
                  onMapClick={handleMapClick}
                  clickedPosition={clickedPosition}
                  selectedIncident={selectedIncident}
                  setSelectedIncident={handleIncidentSelect}
                />
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                {isReporting ? (
                  <form onSubmit={handleFormSubmit}>
                    <h4 className="text-xs font-bold text-cyan-400 mb-4">File Report</h4>
                    <input disabled value={clickedPosition ? `Lat: ${clickedPosition[0].toFixed(5)}, Lon: ${clickedPosition[1].toFixed(5)}` : ''} className="w-full bg-slate-950 border p-2 mb-2 text-xs" />
                    <select onChange={(e) => setUtilityType(e.target.value)} className="w-full bg-slate-950 border p-2 mb-2 text-xs">
                      <option>Electricity</option>
                      <option>Water</option>
                      <option>Gas</option>
                    </select>
                    <input required placeholder="Street Name" onChange={(e) => setLocationName(e.target.value)} className="w-full bg-slate-950 border p-2 mb-2 text-xs" />
                    <textarea required placeholder="Description" onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-950 border p-2 mb-2 text-xs h-24" />
                    <button type="submit" className="w-full py-2 bg-cyan-600 text-xs font-bold rounded">SUBMIT</button>
                  </form>
                ) : selectedIncident ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-cyan-400">Incident Detail</h4>
                    <div className="space-y-2">
                      <p className="text-xs"><strong>Type:</strong> {selectedIncident.utilityType}</p>
                      <p className="text-xs"><strong>Location:</strong> {selectedIncident.locationName}</p>
                      <p className="text-xs"><strong>Reported By:</strong> {selectedIncident.reporterName}</p>
                      <p className="text-xs"><strong>Confirmations:</strong> <span className="text-emerald-400 font-bold">{selectedIncident.upvotes || 0} residents</span></p>
                      {/* ahnaf start */}
                      <p className="text-xs">
                        <strong>Repair Status:</strong>{' '}
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: (STATUS_COLORS[selectedIncident.status] || '#aaa') + '22',
                            color: STATUS_COLORS[selectedIncident.status] || '#aaa',
                          }}
                        >
                          {STATUS_LABELS[selectedIncident.status] || selectedIncident.status}
                        </span>
                      </p>
                      {/* ahnaf end */}
                      <p className="text-xs italic bg-slate-950 p-3 border border-slate-800 rounded">"{selectedIncident.description}"</p>
                    </div>

                    {selectedIncident.reporterId !== user.id && (
                      <button
                        onClick={() => handleUpvote(selectedIncident._id)}
                        className={`w-full py-2 text-white text-xs font-bold rounded transition-colors ${
                          hasUpvoted 
                            ? 'bg-amber-700 hover:bg-amber-600' 
                            : 'bg-emerald-700 hover:bg-emerald-600'
                        }`}
                      >
                        {hasUpvoted ? '👎 REMOVE MY CONFIRMATION' : '👍 ME TOO / CONFIRM OUTAGE'}
                      </button>
                    )}

                    {selectedIncident.reporterId === user.id && (
                      <button
                        onClick={() => handleDeleteReport(selectedIncident._id)}
                        className="w-full py-2 bg-red-900/50 text-red-400 text-xs font-bold rounded hover:bg-red-900"
                      >
                        REMOVE REPORT
                      </button>
                    )}

                    {/* Turan: Chat with assigned technician — only show to reporter once technician is assigned (Chat Feature) */}
                    {selectedIncident.reporterId === user.id && selectedIncident.assignedTo && (
                      <ChatPanel
                        outageId={selectedIncident._id}
                        currentUser={user}
                        otherName={selectedIncident.assignedToName || 'Technician'}
                      />
                    )}
                    {/* Turan End */}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Select a pin to view details, or click the map to file a report.</p>
                )}
              </div>
            </div>
          ) : activeTab === 'faq' ? (
            <div className="flex-1 bg-slate-900 p-6 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
              <ResidentFAQView />
            </div>
          ) : (
            <ResidentRegistryList 
              outages={allOutages} 
              user={user} 
              handleDeleteReport={handleDeleteReport}
              handleSubmitReview={handleSubmitReview}
            />
          )}
        </div>
      )}
    </div>
    </div>
    {/*Turan: Subscription Modal Render*/}
    {showSubscribeModal && (
      <ResidentSubscriptionModal
        user={user}
        onClose={() => setShowSubscribeModal(false)}
        onSuccess={() => setIsSubscribed(true)}
      />
    )}
    {/*Turan End*/}
    </>
  );
}

export default ResidentDashboard;