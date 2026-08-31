import React, { useState } from 'react';
// --- COMPONENT PORTAL LINKING ---
import AdminDashboard from './components/admin/AdminDashboard';
import TechnicianDashboard from './components/technician/TechnicianDashboard';
import WarehouseDashboard from './components/warehouse/WarehouseDashboard';
import ResidentDashboard from './components/resident/ResidentDashboard';

// Environment variable for Vercel backend deployment compatibility
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  // --- STATE MANAGEMENT ---
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Active session profile tracker filled by real DB data
  const [currentUser, setCurrentUser] = useState(null); 
  
  // Tracking selected user role for customized registration requirements
  const [selectedRole, setSelectedRole] = useState('resident');
  
  // Form input field tracks
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Specialized pre-verification ID parameters from company email
  const [employeeId, setEmployeeId] = useState('');
  const [auditorId, setAuditorId] = useState('');

  // Loading state to show spinner while email verification + registration is processing
  const [isLoading, setIsLoading] = useState(false);

  // --- SUBMISSION HANDLER ---
  const handleAuthAction = async (e) => {
    e.preventDefault();
    
    if (isRegistering) {
      // --- REGISTRATION FLOW ---
      const registrationPayload = {
        name: name,
        email: email,
        phone: phone,
        username: username,
        password: password,
        role: selectedRole,
        employeeId: selectedRole === 'technician' ? employeeId : '',
        auditorId: selectedRole === 'warehouse' ? auditorId : ''
      };
      
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(registrationPayload)
        });

        const data = await response.json();

        if (response.ok) {
          alert(data.message || "Registration Successful!");
          setIsRegistering(false); // Direct user to login form screen layout
          
          // Clear field states
          setName('');
          setEmail('');
          setPhone('');
          setEmployeeId('');
          setAuditorId('');
          setUsername('');
          setPassword('');
        } else {
          alert("Error: " + (data.error || "Registration failed"));
        }

      } catch (error) {
        console.error("Network interface connection failure:", error);
        alert("Could not establish a secure connection link with backend node.");
      } finally {
        setIsLoading(false);
      }
      
    } else {
      // --- REAL DATABASE LOGIN FLOW ---
      const loginPayload = {
        username: username,
        password: password
      };
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loginPayload)
        });

        const data = await response.json();

        if (response.ok) {
          // Bind the user session strictly to the authenticated record returned from MongoDB
          setCurrentUser(data.user);
          alert(data.message || "Authentication successful!");
        } else {
          // Display explicit error details from the database validation failure
          alert("Authentication Failed: " + (data.error || "Invalid credentials"));
        }

      } catch (error) {
        console.error("Network interface connection failure:", error);
        alert("Could not establish a secure connection link with backend node.");
      }
    }
  };

  // --- TERMINATE ACTIVE NODE SESSION ---
  const handleLogout = () => {
    setCurrentUser(null);
    setUsername('');
    setPassword('');
  };

  // --- DYNAMIC INFRASTRUCTURE PORTAL ROUTER ---
  if (currentUser !== null) {
    if (currentUser.role === 'admin') {
      return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
    }
    
    if (currentUser.role === 'technician') {
      return <TechnicianDashboard user={currentUser} onLogout={handleLogout} />;
    }
    
    if (currentUser.role === 'warehouse') {
      return <WarehouseDashboard user={currentUser} onLogout={handleLogout} />;
    }
    
    return <ResidentDashboard user={currentUser} onLogout={handleLogout} />;
  }

  // --- LOGIN / REGISTER GATEWAY VIEW ---
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Decorative premium ambient blur backdrops */}
      <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Framework Wrapper */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 p-6 max-w-6xl mx-auto w-full z-10">
        
        {/* Left Section: Uniform Branding Identity */}
        <div className="flex-1 text-center md:text-left max-w-md">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
            <div className="w-12 h-12 bg-slate-900 border border-cyan-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <span className="font-black text-2xl tracking-tighter text-cyan-400">U</span>
            </div>
            <div>
              <span className="font-black text-3xl tracking-wider block leading-none text-white">UTILIX</span>
              <span className="text-[10px] text-cyan-400 font-bold tracking-[0.25em]">MANAGEMENT</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-200 mb-2">
            Empowering Utilities.
          </h1>
          <p className="text-slate-400 text-sm hidden md:block">
            View and Report Utilities Problems at your fingertips at ease.
          </p>
        </div>

        {/* Right Section: Adaptive Login / Interactive Registration Card */}
        <div className="w-full max-w-[450px]">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md transition-all duration-300">
            
            <h2 className="text-xl font-bold tracking-tight text-white mb-6">
              {isRegistering ? 'Create Operational Account' : 'Account Login'}
            </h2>
            
            <form onSubmit={handleAuthAction} className="space-y-4">
              
              {/* Specialized Role Selection Tabs - Highlighted clearly during Registration */}
              {isRegistering && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Account Role</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button 
                      type="button"
                      onClick={() => setSelectedRole('resident')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${selectedRole === 'resident' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      Resident
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedRole('technician')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${selectedRole === 'technician' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      Technician
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedRole('warehouse')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${selectedRole === 'warehouse' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      Depot Staff
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Base Fields: Used during registration */}
              {isRegistering && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe" 
                      required
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="johndoe@gmail.com" 
                      required
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+8801XXXXXXXXX" 
                      required
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </>
              )}

              {/* Specialized Technician Verification ID */}
              {isRegistering && selectedRole === 'technician' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                  <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider">Official Verification ID</label>
                  <input 
                    type="text" 
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter Company Provided Employee ID" 
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                  />
                </div>
              )}

              {/* Specialized Depot Staff Verification ID */}
              {isRegistering && selectedRole === 'warehouse' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                  <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider">Official Verification ID</label>
                  <input 
                    type="text" 
                    value={auditorId}
                    onChange={(e) => setAuditorId(e.target.value)}
                    placeholder="Enter Company Provided Auditor ID" 
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                  />
                </div>
              )}

              {/* Core Access Input Identifiers (Used in both workflows) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Unique Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username" 
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Secure Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Dynamic Submission Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/10 active:scale-[0.99] flex items-center justify-center gap-2 ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading && isRegistering ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying Email...
                    </>
                  ) : (
                    isRegistering ? 'Register' : 'Login'
                  )}
                </button>
              </div>

            </form>

            {/* Visual Separation Boundary */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-500 font-medium">
                  {isRegistering ? 'Already part of the network?' : 'New deployment?'}
                </span>
              </div>
            </div>

            {/* Toggle System State UI Button */}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full py-3 bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-all duration-200"
            >
              {isRegistering ? 'Back to Portal Access' : 'Register Core Account'}
            </button>

          </div>
        </div>

      </main>

      {/* Persistent Global System Footer */}
      <footer className="py-5 text-center text-xs text-slate-600 tracking-wide bg-slate-950/40 z-10">
        &copy; {new Date().getFullYear()} Utilix Management System. Infrastructure Node Secure.
      </footer>

    </div>
  );
}

export default App;