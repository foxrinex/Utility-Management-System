import React, { useState, useEffect, useRef } from 'react';
import { PreviewMap, TechFullMap } from './TechMapOverview';
import { TaskPanel, TechTaskList } from './TechTaskList';
import { TechForum } from './TechForum';
// Nusfat: Shift Toggle Import for Duty Status Feature
import ShiftToggle from './ShiftToggle';
// Nusfat end

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

const API = 'http://localhost:5000';

function TechnicianDashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [showFullMap, setShowFullMap] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // --- FORUM STATES ---
  const [forumPosts, setForumPosts] = useState([]);
  const [forumTitle, setForumTitle] = useState('');
  const [forumCategory, setForumCategory] = useState('Electricity');
  const [forumContent, setForumContent] = useState('');
  const [forumOutageId, setForumOutageId] = useState('');
  const [replyContent, setReplyContent] = useState({});

  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostCategory, setEditPostCategory] = useState('Electricity');
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostOutageId, setEditPostOutageId] = useState('');

  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');

  // Turan: Location broadcaster state and ref (Location Feature)
  const locationIntervalRef = useRef(null);
  const [isTracking, setIsTracking] = useState(false);

  const stopLocationBroadcast = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    setIsTracking(false);
  };

  const startLocationBroadcast = (outageId, destLat, destLng) => {
    stopLocationBroadcast();
    setIsTracking(true);

    const sendLocation = (lat, lng) => {
      fetch(`${API}/api/outages/location/${outageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      }).catch((err) => console.error('Location broadcast error:', err));
    };

    // Try real GPS first, fall back to simulated approach
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          let lat = pos.coords.latitude;
          let lng = pos.coords.longitude;
          sendLocation(lat, lng);
          // Step simulation: inch toward incident every 4s
          locationIntervalRef.current = setInterval(() => {
            lat = lat + (destLat - lat) * 0.08;
            lng = lng + (destLng - lng) * 0.08;
            sendLocation(lat, lng);
          }, 4000);
        },
        () => {
          // GPS denied — simulate from offset near destination
          let lat = destLat - 0.025 + Math.random() * 0.01;
          let lng = destLng - 0.025 + Math.random() * 0.01;
          sendLocation(lat, lng);
          locationIntervalRef.current = setInterval(() => {
            lat = lat + (destLat - lat) * 0.1;
            lng = lng + (destLng - lng) * 0.1;
            sendLocation(lat, lng);
          }, 4000);
        }
      );
    } else {
      // No geolocation API — pure simulation
      let lat = destLat - 0.02;
      let lng = destLng - 0.02;
      sendLocation(lat, lng);
      locationIntervalRef.current = setInterval(() => {
        lat = lat + (destLat - lat) * 0.1;
        lng = lng + (destLng - lng) * 0.1;
        sendLocation(lat, lng);
      }, 4000);
    }
  };

  // Stop tracking on unmount
  useEffect(() => {
    return () => stopLocationBroadcast();
  }, []);
  // Turan End

  const fetchTasks = () => {
    console.log('FETCHING TASKS FOR USER ID:', user.id);
    fetch(`${API}/api/outages/assigned/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('TASKS RETURNED:', JSON.stringify(data)); 
        setTasks(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Task fetch error:', err));
  };

  const fetchForumPosts = () => {
    fetch(`${API}/api/forum/all`)
      .then((res) => res.json())
      .then((data) => {
        setForumPosts(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Forum fetch error:', err));
  };

  useEffect(() => { 
    fetchTasks(); 
    fetchForumPosts();
  }, []);

  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
  };

  const handleMarkResolved = (id) => {
    if (!window.confirm('Mark this task as resolved?')) return;
    fetch(`${API}/api/outages/resolve/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then(() => {
        alert('Task marked as resolved.');
        setSelectedIncident(null);
        fetchTasks();
      })
      .catch((err) => console.error('Resolve error:', err));
  };

  // ahnaf start
  const handleUpdateStatus = (id, newStatus) => {
    const labels = { ON_WAY: 'On Way', ON_SITE: 'On Site', RESOLVED: 'Resolved' };
    if (!window.confirm(`Update task status to "${labels[newStatus] || newStatus}"?`)) return;
    fetch(`${API}/api/outages/status/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.report) {
          setSelectedIncident((prev) =>
            prev && prev._id === id ? data.report : prev
          );
          fetchTasks();
          // Turan: Start/stop location broadcast based on status transition (Location Feature)
          if (newStatus === 'ON_WAY') {
            startLocationBroadcast(id, data.report.latitude, data.report.longitude);
          } else {
            stopLocationBroadcast();
          }
          // Turan End
        }
      })
      .catch((err) => console.error('Status update error:', err));
  };
  // ahnaf end

  // --- FORUM OPERATIONS CRUDS ---
  const handleCreateForumPost = (e) => {
    e.preventDefault();
    if (!forumTitle || !forumContent) {
      alert('Please fill out the forum title and content fields.');
      return;
    }

    const payload = {
      title: forumTitle,
      category: forumCategory,
      questionContent: forumContent,
      askedById: user.id,
      askedByName: user.username,
      outageId: forumOutageId
    };

    fetch(`${API}/api/forum/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then(() => {
        setForumTitle('');
        setForumContent('');
        setForumOutageId('');
        fetchForumPosts();
      })
      .catch((err) => console.error('Error posting forum query:', err));
  };

  const handleStartEditPost = (post) => {
    setEditingPostId(post._id);
    setEditPostTitle(post.title);
    setEditPostCategory(post.category);
    setEditPostContent(post.questionContent);
    setEditPostOutageId(post.outageId?._id || post.outageId || '');
  };

  const handleUpdateForumPost = (postId) => {
    if (!editPostTitle || !editPostContent) {
      alert('Title and Content cannot be empty.');
      return;
    }

    const payload = {
      title: editPostTitle,
      category: editPostCategory,
      questionContent: editPostContent,
      outageId: editPostOutageId
    };

    fetch(`${API}/api/forum/update/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then(() => {
        setEditingPostId(null);
        fetchForumPosts();
      })
      .catch((err) => console.error('Error updating post row:', err));
  };

  const handleDeleteForumPost = (postId) => {
    if (!window.confirm('Delete this forum discussion thread permanently?')) return;
    fetch(`${API}/api/forum/delete/${postId}`, {
      method: 'DELETE'
    })
      .then((res) => res.json())
      .then(() => {
        fetchForumPosts();
      })
      .catch((err) => console.error('Error deleting post row:', err));
  };

  const handleCreateReply = (postId) => {
    const text = replyContent[postId];
    if (!text || text.trim() === '') {
      alert('Reply message cannot be empty.');
      return;
    }

    const payload = {
      authorId: user.id,
      authorName: user.username,
      content: text
    };

    fetch(`${API}/api/forum/reply/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then(() => {
        setReplyContent({ ...replyContent, [postId]: '' });
        fetchForumPosts();
      })
      .catch((err) => console.error('Error saving comment entry:', err));
  };

  const handleStartEditReply = (reply) => {
    setEditingReplyId(reply._id);
    setEditReplyContent(reply.content);
  };

  const handleUpdateReply = (replyId) => {
    if (!editReplyContent) {
      alert('Reply text content cannot be blank.');
      return;
    }

    fetch(`${API}/api/forum/reply/update/${replyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editReplyContent })
    })
      .then((res) => res.json())
      .then(() => {
        setEditingReplyId(null);
        fetchForumPosts();
      })
      .catch((err) => console.error('Error overwriting comment row:', err));
  };

  const handleDeleteReply = (replyId) => {
    if (!window.confirm('Remove this answer from the database?')) return;
    fetch(`${API}/api/forum/reply/delete/${replyId}`, {
      method: 'DELETE'
    })
      .then((res) => res.json())
      .then(() => {
        fetchForumPosts();
      })
      .catch((err) => console.error('Error dropping comment row:', err));
  };

  const filteredTasks = filterStatus === 'ALL'
    ? tasks
    : tasks.filter((t) => t.status === filterStatus);

  const stats = {
    total: tasks.length,
    // ahnaf start
    active: tasks.filter((t) => ['ASSIGNED', 'ON_WAY', 'ON_SITE'].includes(t.status)).length,
    // ahnaf end
    resolved: tasks.filter((t) => t.status === 'RESOLVED').length,
  };


  // Loop 1: Sidebar Stats Layout Generation
  const rawStatsData = [
    { label: 'Total Tasks', value: stats.total, color: 'text-white' },
    // ahnaf start
    { label: 'Active', value: stats.active, color: 'text-cyan-400' },
    // ahnaf end
    { label: 'Resolved', value: stats.resolved, color: 'text-green-400' },
  ];
  const renderedSidebarStats = [];
  for (let i = 0; i < rawStatsData.length; i++) {
    const s = rawStatsData[i];
    renderedSidebarStats.push(
      <div key={s.label} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
      </div>
    );
  }


  // Loop 2: Status Filter Sidebar Buttons Generation
  // ahnaf start
  const statusOptions = ['ALL', 'ASSIGNED', 'ON_WAY', 'ON_SITE', 'RESOLVED'];
  // ahnaf end
  const renderedFilterButtons = [];
  for (let i = 0; i < statusOptions.length; i++) {
    const s = statusOptions[i];
    renderedFilterButtons.push(
      <button
        key={s}
        onClick={() => setFilterStatus(s)}
        className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === s ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
      >
        {s}
      </button>
    );
  }


  // Loop 3: Main Layout Dashboard Content Tabs Generation
  const tabConfig = [
    { key: 'map', label: 'Map View' },
    { key: 'tasks', label: 'My Tasks' },
    { key: 'forum', label: 'Q&A Forum' },
    //Nusfat: Duty Status Tab
    { key: 'duty', label: 'Duty Status' },
    //Nusfat end
  ];
  const renderedNavTabs = [];
  for (let i = 0; i < tabConfig.length; i++) {
    const tab = tabConfig[i];
    renderedNavTabs.push(
      <button
        key={tab.key}
        onClick={() => setActiveTab(tab.key)}
        className={`text-sm font-black uppercase tracking-wider transition-all ${activeTab === tab.key ? 'text-white border-b-2 border-cyan-500 pb-1' : 'text-slate-600 hover:text-slate-400'}`}
      >
        {tab.label}
      </button>
    );
  }


  // Loop 4: Sidebar Summary List Loop of Assigned Items
  const renderedSummaryList = [];
  for (let i = 0; i < filteredTasks.length; i++) {
    const incidentItem = filteredTasks[i];
    renderedSummaryList.push(
      <div key={incidentItem._id} className="flex justify-between text-xs py-2 border-b border-slate-800 last:border-0">
        <span className="font-bold text-cyan-400">{incidentItem.utilityType}</span>
        <span className="text-slate-400">{incidentItem.locationName}</span>
        <span style={{ color: STATUS_COLORS[incidentItem.status] || '#aaa' }} className="text-[10px] font-bold">{incidentItem.status}</span>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans flex gap-6">

      {/* ── Left Sidebar ── */}
      <div className="w-1/3 flex flex-col gap-6">

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-500 bg-slate-800 flex items-center justify-center text-xl font-bold">
            {(user?.username || 'T')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black">Technician Panel</h1>
            <p className="text-slate-500 text-xs">Hello {user?.username}</p>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Field Technician</span>
          </div>
        </div>

        <button
          onClick={() => setShowFullMap(true)}
          className="w-full py-3 bg-cyan-600 rounded-lg text-xs font-bold hover:bg-cyan-500"
        >
          LAUNCH FULL INTERACTIVE MAP
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {renderedSidebarStats}
        </div>

        {/* Filter */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-cyan-400 uppercase mb-3">Filter by Status</h4>
          <div className="flex flex-col gap-2">
            {renderedFilterButtons}
          </div>
        </div>

        {/* Turan: Live tracking active indicator badge (Location Feature) */}
        {isTracking && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(251,146,60,0.12)',
            border: '1px solid rgba(251,146,60,0.4)',
            fontSize: '11px',
            fontWeight: 800,
            color: '#fb923c',
            letterSpacing: '0.05em',
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#fb923c',
              boxShadow: '0 0 0 0 rgba(251,146,60,0.6)',
              animation: 'locationPulse 1.2s infinite',
              display: 'inline-block',
              flexShrink: 0,
            }}></span>
            🚗 LIVE LOCATION BROADCASTING
            <style>{`@keyframes locationPulse { 0%{box-shadow:0 0 0 0 rgba(251,146,60,0.6)} 70%{box-shadow:0 0 0 8px rgba(251,146,60,0)} 100%{box-shadow:0 0 0 0 rgba(251,146,60,0)} }`}</style>
          </div>
        )}
        {/* Turan End */}

        <button
          onClick={onLogout}
          className="w-full py-3 bg-slate-800 text-xs font-bold rounded-lg hover:bg-red-900/50 hover:text-red-400 transition-all"
        >
          LOGOUT
        </button>
      </div>

      {/* ── Main Panel ── */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">

        <div className="flex gap-6 p-6 border-b border-slate-800">
          {renderedNavTabs}
        </div>

        {activeTab === 'map' ? (
          <div className="flex flex-col gap-4 p-6 flex-1 overflow-hidden">
            {!showFullMap && <PreviewMap outages={filteredTasks} onClick={() => setShowFullMap(true)} />}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-60 overflow-y-auto">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-3">My Assigned Tasks</h5>
              {filteredTasks.length === 0 && (
                <p className="text-xs text-slate-600 italic">No tasks assigned to you yet.</p>
              )}
              {renderedSummaryList}
            </div>
          </div>
        ) : activeTab === 'tasks' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <TechTaskList 
              filteredTasks={filteredTasks}
              handleSelectIncident={handleSelectIncident}
              setShowFullMap={setShowFullMap}
              setActiveTab={setActiveTab}
              handleMarkResolved={handleMarkResolved}
              // ahnaf start
              handleUpdateStatus={handleUpdateStatus}
              // ahnaf end
            />
          </div>
        //Nusfat: Duty Status Tab Content
        ) : activeTab === 'duty' ? (
          <ShiftToggle user={user} />
        //Nusfat end
        ) : (
          <TechForum 
            user={user}
            tasks={tasks}
            forumPosts={forumPosts}
            forumTitle={forumTitle} setForumTitle={setForumTitle}
            forumCategory={forumCategory} setForumCategory={setForumCategory}
            forumContent={forumContent} setForumContent={setForumContent}
            forumOutageId={forumOutageId} setForumOutageId={setForumOutageId}
            replyContent={replyContent} setReplyContent={setReplyContent}
            editingPostId={editingPostId} setEditingPostId={setEditingPostId}
            editPostTitle={editPostTitle} setEditPostTitle={setEditPostTitle}
            editPostCategory={editPostCategory} setEditPostCategory={setEditPostCategory}
            editPostContent={editPostContent} setEditPostContent={setEditPostContent}
            editPostOutageId={editPostOutageId} setEditPostOutageId={setEditPostOutageId}
            editingReplyId={editingReplyId} setEditingReplyId={setEditingReplyId}
            editReplyContent={editReplyContent} setEditReplyContent={setEditReplyContent}
            handleCreateForumPost={handleCreateForumPost}
            handleStartEditPost={handleStartEditPost}
            handleUpdateForumPost={handleUpdateForumPost}
            handleDeleteForumPost={handleDeleteForumPost}
            handleCreateReply={handleCreateReply}
            handleStartEditReply={handleStartEditReply}
            handleUpdateReply={handleUpdateReply}
            handleDeleteReply={handleDeleteReply}
          />
        )}
      </div>

      {/* ── Full Map Overlay ── */}
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
                onClick={() => setActiveTab('tasks')}
                className={`text-xl font-black cursor-pointer ${activeTab === 'tasks' ? 'text-white' : 'text-slate-600'}`}
              >
                My Tasks
              </h2>
            </div>
            <button onClick={() => setShowFullMap(false)} className="px-4 py-2 bg-slate-800 rounded text-xs">
              [CLOSE]
            </button>
          </div>

          {activeTab === 'map' ? (
            <div className="grid grid-cols-3 gap-8 flex-1 overflow-hidden">
              <div className="col-span-2 rounded-2xl overflow-hidden border border-slate-800" style={{ minHeight: '400px' }}>
                <TechFullMap
                  outages={filteredTasks}
                  setSelectedIncident={handleSelectIncident}
                />
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 overflow-y-auto">
                <TaskPanel
                  selectedIncident={selectedIncident}
                  setSelectedIncident={setSelectedIncident}
                  onMarkResolved={handleMarkResolved}
                  // Turan: Pass current user to TaskPanel for chat identification (Chat Feature)
                  currentUser={user}
                  // Turan End
                  // ahnaf start
                  onUpdateStatus={handleUpdateStatus}
                  // ahnaf end
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4">
              <TechTaskList 
                filteredTasks={filteredTasks}
                handleSelectIncident={handleSelectIncident}
                setShowFullMap={setShowFullMap}
                setActiveTab={setActiveTab}
                handleMarkResolved={handleMarkResolved}
                // ahnaf start
                handleUpdateStatus={handleUpdateStatus}
                // ahnaf end
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TechnicianDashboard;