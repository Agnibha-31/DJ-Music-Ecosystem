import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Music2, 
  BarChart3,
  PieChart,
  Shield,
  Clock,
  Settings,
  Users,
  Bell,
  User,
  Radio,
  MapPin,
  AlertTriangle,
  Power,
  Menu as MenuIcon,
  Trash2,
  LogOut
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useEffect, useMemo, useState } from 'react';
import { adminChangePassword, getAccessToken, requestJson } from '../../utils/apiClient';
import { clearAdminAuth, getCurrentAdminProfile, isAdminAuthed } from '../../utils/adminStorage';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { venue, analytics, activityLogs, systemMode, removeActivityLog } = useAdmin();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queuePolls, setQueuePolls] = useState<Array<{ id: string; title: string; artist: string; status: string; venueId: string }>>([]);
  
  // Admin Settings State
  const [adminProfile, setAdminProfile] = useState({
    fullName: 'Admin',
    email: 'admin@groovelounge.com',
    username: 'admin'
  });
  const [newPassword, setNewPassword] = useState('');
  const [adminSaved, setAdminSaved] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const isValidName = (value: string) => /^[A-Za-z][A-Za-z\s'-]{1,}$/.test(value.trim());
  const isValidPassword = (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
  
  // Modals
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const recentNotifications = activityLogs.slice(0, 10).map(log => ({
    id: log.id,
    title: log.description,
    time: new Date(log.timestamp).toLocaleTimeString(),
    type: log.type,
    unread: Date.now() - log.timestamp < 300000,
  }));

  const unreadCount = recentNotifications.filter(n => n.unread).length;


  const handleDeleteNotification = (notifId: string) => {
    removeActivityLog(notifId);
  };

  const handleSaveAdminSettings = () => {
    const trimmed = newPassword.trim();
    if (!trimmed) {
      setPasswordError('Enter a new password.');
      return;
    }
    if (!isValidPassword(trimmed)) {
      setPasswordError('Password must be 8 chars with upper, lower, number, special.');
      return;
    }
    setPasswordError('');
    setConfirmPassword('');
    setConfirmError('');
    setIsConfirmOpen(true);
  };

  const handleConfirmPasswordChange = async () => {
    if (confirmPassword !== newPassword.trim()) {
      setConfirmError('Passwords do not match.');
      return;
    }
    try {
      await adminChangePassword({ newPassword: newPassword.trim() });
      setNewPassword('');
      setIsConfirmOpen(false);
      setAdminSaved(true);
      setTimeout(() => setAdminSaved(false), 2000);
    } catch (error) {
      console.error('Change password failed', error);
      setConfirmError('Unable to change password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAdminPanelOpen(false);
    clearAdminAuth();
    navigate('/login');
  };


  useEffect(() => {
    if (!isAdminAuthed()) {
      clearAdminAuth();
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const profile = getCurrentAdminProfile();
    if (!profile) return;
    const firstName = profile.firstName?.trim() ?? '';
    const lastName = profile.lastName?.trim() ?? '';
    const username = profile.username?.trim() || firstName.toLowerCase() || 'admin';
    const fullName = `${firstName} ${lastName}`.trim() || username || 'Admin';
    const hasStoredName = firstName.length > 0 || lastName.length > 0;

    const hasInvalidStoredName =
      (firstName.length > 0 && !isValidName(firstName)) ||
      (lastName.length > 0 && !isValidName(lastName));

    if (hasStoredName && hasInvalidStoredName) {
      if (!sessionStorage.getItem('admin_name_invalid_alerted')) {
        sessionStorage.setItem('admin_name_invalid_alerted', 'true');
        alert('Stored name is invalid. Please update your profile.');
      }
    }
    setAdminProfile({
      fullName,
      email: profile.email ?? 'admin@groovelounge.com',
      username
    });
  }, []);

  useEffect(() => {
    const loadQueuePolls = async () => {
      try {
        if (!getAccessToken()) return;
        const data = await requestJson<{ items: any[] }>("/queue/all");
        const items = (data.items ?? []).map((item) => ({
          id: String(item.id ?? ''),
          title: String(item.songTitle ?? item.title ?? ''),
          artist: String(item.artist ?? ''),
          status: String(item.status ?? 'pending'),
          venueId: String(item.venue_id ?? '')
        }));
        setQueuePolls(items);
      } catch (error) {
        console.error('Load queue polls failed', error);
      }
    };

    loadQueuePolls();
  }, []);

  const totalPollCount = useMemo(() => {
    const activeQueuePolls = queuePolls.filter((item) => item.status === 'pending' && item.title.trim().length > 0);
    const grouped = new Map<string, true>();

    activeQueuePolls.forEach((item) => {
      const key = `${item.venueId}::${item.title.trim().toLowerCase()}::${item.artist.trim().toLowerCase()}`;
      grouped.set(key, true);
    });

    return grouped.size;
  }, [queuePolls]);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { path: '/analytics/playback', icon: BarChart3, label: 'Playback Analytics', badge: null },
    { path: '/analytics/polls', icon: PieChart, label: 'Poll Analytics', badge: totalPollCount },
    { path: '/monitoring', icon: Users, label: 'User Monitoring', badge: analytics.activeUsers },
    { path: '/songs', icon: Music2, label: 'Song Management', badge: analytics.activeSongs },
    { path: '/control', icon: Shield, label: 'Control & Override', badge: null },
    { path: '/history', icon: Clock, label: 'History & Logs', badge: null },
    { path: '/settings', icon: Settings, label: 'System Config', badge: null },
  ];


  return (
    <div className="min-h-screen flex items-stretch bg-slate-950">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={false}
            animate={{
              width: sidebarCollapsed ? 80 : 288,
              transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
            }}
            className="fixed inset-y-0 lg:inset-y-auto lg:relative lg:self-stretch z-50 bg-gradient-to-b from-slate-900/98 via-purple-950/98 to-slate-900/98 backdrop-blur-xl border-r border-purple-500/20 shadow-2xl shadow-purple-500/10 overflow-hidden"
          >
            <div className="flex flex-col h-full lg:h-auto lg:min-h-full overflow-hidden max-w-full">
              {/* Header - Professional Layout */}
              <div className={`border-b border-purple-500/20 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
                <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                  {/* Left: Icon - Hidden when collapsed */}
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1, rotate: 360 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.2 }
                      }}
                      className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 shadow-lg shadow-purple-500/30 flex-shrink-0"
                    >
                      <Radio className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                  
                  {/* Center-Left: Text */}
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 min-w-0"
                    >
                      <h1 className="text-base font-black text-white tracking-tight truncate">Admin Panel</h1>
                      <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">Control Center</p>
                    </motion.div>
                  )}
                  
                  {/* Collapse Button - Centered when collapsed */}
                  <motion.button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0 flex items-center justify-center ${
                      sidebarCollapsed ? 'p-2 h-9 w-10' : 'p-2 h-10 w-10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    <MenuIcon className={sidebarCollapsed ? 'w-6 h-5' : 'w-6 h-6'} />
                  </motion.button>
                  
                </div>
              </div>

              {/* Navigation */}
              <nav className={`flex-1 space-y-1 overflow-y-auto overflow-x-hidden ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                      <motion.div
                        className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-3 px-4 py-3.5 rounded-xl transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/20 border border-purple-500/40 text-white shadow-lg shadow-purple-500/20'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                        }`}
                        whileHover={{ scale: 1.02, x: sidebarCollapsed ? 0 : 4 }}
                        whileTap={{ scale: 0.98 }}
                        title={sidebarCollapsed ? item.label : ''}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
                          {!sidebarCollapsed && <span className="font-bold text-sm">{item.label}</span>}
                        </div>
                        {!sidebarCollapsed && item.badge !== null && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isActive 
                              ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40' 
                              : 'bg-slate-800 text-gray-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-cyan-500 rounded-r-full"
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-visible">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900/95 via-purple-950/95 to-slate-900/95 backdrop-blur-xl border-b border-purple-500/20 shadow-xl shadow-purple-500/5">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Menu + Venue Name */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">{venue.name}</h2>
                    <p className="text-xs text-purple-400 font-semibold">{venue.address}, {venue.city}, {venue.state}</p>
                  </div>
                </div>
              </div>

              {/* Center: Quick Stats + System Status */}
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Requests</div>
                    <div className="text-xl font-black text-white">{analytics.activeRequests}</div>
                  </div>
                  <div className="w-px h-8 bg-purple-500/20" />
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Songs</div>
                    <div className="text-xl font-black text-white">{analytics.totalSongs}</div>
                  </div>
                  <div className="w-px h-8 bg-purple-500/20" />
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Polls</div>
                      <div className="text-xl font-black text-white">{totalPollCount}</div>
                  </div>
                </div>
                
                <div className="w-px h-10 bg-purple-500/20 mx-2" />
                
                {/* System Status Indicators */}
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${systemMode.isLive ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                    <Power className={`w-3 h-3 ${systemMode.isLive ? 'text-emerald-400' : 'text-red-400'}`} />
                    <span className={`text-[10px] font-black ${systemMode.isLive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {systemMode.isLive ? 'LIVE' : 'OFF'}
                    </span>
                  </div>
                  {systemMode.isMaintenance && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                      <AlertTriangle className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] font-black text-yellow-400">MAINT</span>
                    </div>
                  )}
                  {systemMode.isOverrideEnabled && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30">
                      <Shield className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] font-black text-orange-400">OVERRIDE</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <motion.button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </motion.button>

                {/* User Profile */}
                <motion.button
                  onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                  className="flex items-center gap-3 p-2 pr-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-black text-white">{adminProfile.fullName}</div>
                    <div className="text-[10px] text-gray-400 font-semibold">Super User</div>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Notification Panel */}
          <AnimatePresence>
            {isNotificationOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-4 top-20 w-96 bg-slate-900/98 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-purple-500/20">
                  <h3 className="text-lg font-black text-white">Notifications</h3>
                  <p className="text-xs text-purple-400">{unreadCount} unread</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    recentNotifications.map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors group ${notif.unread ? 'bg-purple-500/5' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${notif.unread ? 'bg-purple-500' : 'bg-gray-600'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-semibold">{notif.title}</div>
                            <div className="text-gray-400 text-xs mt-1">{notif.time}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 transition-all"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Admin Panel */}
          <AnimatePresence>
            {isAdminPanelOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-4 top-20 w-80 bg-slate-900/98 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-purple-500/20">
                  <h3 className="text-lg font-black text-white">Admin Settings</h3>
                  <p className="text-xs text-purple-400">Manage your account</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">Username</label>
                    <input
                      type="text"
                      value={adminProfile.fullName}
                      readOnly
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">Email</label>
                    <input
                      type="email"
                      value={adminProfile.email}
                      readOnly
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewPassword(value);
                        if (!value) {
                          setPasswordError('');
                        } else if (!isValidPassword(value)) {
                          setPasswordError('Password must be 8 chars with upper, lower, number, special.');
                        } else {
                          setPasswordError('');
                        }
                      }}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    {passwordError && (
                      <p className="text-[11px] mt-2" style={{ color: '#ef4444' }}>
                        {passwordError}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveAdminSettings}
                      className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${
                        adminSaved ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {adminSaved ? 'Saved' : 'Change Password'}
                    </button>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isConfirmOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="fixed z-50"
                style={{ left: '30%', top: '280%', transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-80 bg-slate-900/98 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-purple-500/20">
                    <h3 className="text-lg font-black text-white">Confirm Password</h3>
                    <p className="text-xs text-purple-400">Re-enter to apply changes</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-400 mb-2 block">Retype Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (confirmError) {
                            setConfirmError('');
                          }
                        }}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                      {confirmError && <p className="text-[11px] text-red-300 mt-2">{confirmError}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmPasswordChange}
                        className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 border border-emerald-500/30 text-emerald-300 font-bold text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setIsConfirmOpen(false)}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-500 border border-red-500/30 text-red-300 font-bold text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
          <div className="max-w-[1800px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
