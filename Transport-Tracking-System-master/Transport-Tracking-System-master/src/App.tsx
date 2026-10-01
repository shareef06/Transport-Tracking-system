/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Bus, Route, Stop, Driver, Notification } from './types';
import AuthPage from './components/AuthPage';
import PassengerDashboard from './components/PassengerDashboard';
import OperatorDashboard from './components/OperatorDashboard';
import AdminDashboard from './components/AdminDashboard';
import { 
  Radio, LogOut, User as UserIcon, Bell, ChevronDown, Check, Info, Shield, 
  MapPin, ShieldAlert, Sun, Moon 
} from 'lucide-react';

export default function App() {
  // --- USER SESSION STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // --- DATA STATES ---
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- UI CONTROLS ---
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load session from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('tts_user');
    const savedToken = localStorage.getItem('tts_token');
    const savedTheme = localStorage.getItem('tts_theme');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    if (savedTheme) {
      setTheme(savedTheme as any);
    }
    setCheckingSession(false);
  }, []);

  // Fetch initial master datasets
  useEffect(() => {
    fetchRoutes();
    fetchStops();
    fetchNotifications();
    fetchDrivers();
    fetchBuses();

    // Setup coordinate and fleet state polling every 3 seconds
    const interval = setInterval(() => {
      fetchBuses();
      fetchDrivers();
      fetchNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchBuses = async () => {
    try {
      const res = await fetch('/api/buses');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setBuses(data);
      }
    } catch (e) {
      console.error('Error fetching buses:', e);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch('/api/routes');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (e) {
      console.error('Error fetching routes:', e);
    }
  };

  const fetchStops = async () => {
    try {
      const res = await fetch('/api/stops');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setStops(data);
      }
    } catch (e) {
      console.error('Error fetching stops:', e);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (e) {
      console.error('Error fetching drivers:', e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const handleLoginSuccess = (usr: User, tkn: string) => {
    setUser(usr);
    setToken(tkn);
    localStorage.setItem('tts_user', JSON.stringify(usr));
    localStorage.setItem('tts_token', tkn);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('tts_user');
    localStorage.removeItem('tts_token');
    setShowProfileMenu(false);
    setShowNotifications(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('tts_theme', nextTheme);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-xs text-slate-500 font-medium">Checking security session tokens...</div>
        </div>
      </div>
    );
  }

  // Visual classes for theme wrapper
  const themeClass = theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';

  return (
    <div className={`min-h-screen transition-colors duration-150 font-sans ${themeClass}`}>
      {user ? (
        <>
          {/* Main App Navigation Header */}
          <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              
              {/* Left Logo */}
              <div className="flex items-center gap-2.5 select-none">
                <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10">
                  <Radio size={20} className="animate-pulse" />
                </div>
                <div>
                  <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100 font-sans">
                    Transport Tracking System
                  </h1>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                    user.role === 'ADMIN'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50'
                      : user.role === 'OPERATOR'
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50'
                      : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50'
                  }`}>
                    {user.role} Dashboard
                  </span>
                </div>
              </div>

              {/* Right Menu Controls */}
              <div className="flex items-center gap-4">
                
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90 cursor-pointer"
                  title="Toggle Visual Mode"
                >
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                {/* Notifications Drawer Toggle */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowProfileMenu(false);
                    }}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90 relative cursor-pointer"
                  >
                    <Bell size={18} />
                    {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    )}
                  </button>

                  {/* Notifications Overlay Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl z-50 text-slate-800 dark:text-slate-100">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 flex justify-between items-center">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Alert Announcements</h4>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{notifications.length} active</span>
                      </div>
                      <div className="space-y-3.5 max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400">
                            No notifications on record.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.notificationId} className="space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className={`font-bold flex items-center gap-1 ${
                                  notif.type === 'delay' ? 'text-amber-500' : 'text-blue-500'
                                }`}>
                                  {notif.type === 'delay' ? <ShieldAlert size={12} /> : <Info size={12} />}
                                  {notif.title}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowProfileMenu(!showProfileMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-1.5 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={14} className="text-slate-500" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl z-50">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{user.name}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      </div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left py-2 px-2.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                      >
                        <LogOut size={14} />
                        Logout Session
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </nav>

          {/* Active View Container Router */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {user.role === 'PASSENGER' && (
              <PassengerDashboard
                user={user}
                buses={buses}
                routes={routes}
                stops={stops}
                notifications={notifications}
                onRefreshBuses={fetchBuses}
              />
            )}
            {user.role === 'OPERATOR' && (
              <OperatorDashboard
                user={user}
                buses={buses}
                routes={routes}
                stops={stops}
                drivers={drivers}
                notifications={notifications}
                onRefreshBuses={fetchBuses}
                onRefreshDrivers={fetchDrivers}
              />
            )}
            {user.role === 'ADMIN' && (
              <AdminDashboard
                user={user}
                buses={buses}
                routes={routes}
                stops={stops}
                drivers={drivers}
                onRefreshBuses={fetchBuses}
                onRefreshRoutes={fetchRoutes}
              />
            )}
          </main>
        </>
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
