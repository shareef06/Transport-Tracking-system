/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Route, Stop, Bus, Driver } from '../types';
import { 
  Users, BarChart3, Radio, Plus, Settings, Sparkles, UserMinus, Shield, MapPin, 
  Trash2, ShieldCheck, Download, RefreshCw, AlertCircle, FileSpreadsheet, Check,
  Locate, Compass
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  buses: Bus[];
  routes: Route[];
  stops: Stop[];
  drivers: Driver[];
  onRefreshBuses: () => void;
  onRefreshRoutes: () => void;
}

interface AIResponse {
  summary: string;
  efficiencyScore: number;
  recommendations: Array<{
    routeId: string;
    routeName: string;
    issue: string;
    suggestion: string;
    expectedImpact: string;
  }>;
}

export default function AdminDashboard({
  user,
  buses,
  routes,
  stops,
  drivers,
  onRefreshBuses,
  onRefreshRoutes
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'routes' | 'ai' | 'tracking'>('analytics');
  const [selectedTrackedUserId, setSelectedTrackedUserId] = useState<string | null>(null);
  
  // Analytics Data state
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Users State
  const [userList, setUserList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Route builder state
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('');
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [routeSuccess, setRouteSuccess] = useState<string | null>(null);

  // AI Optimizer state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProgressText, setAiProgressText] = useState('Initiating transport planning models...');

  // Report download simulation
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
  }, []);

  // Background refresh for commuter tracking telemetry
  useEffect(() => {
    if (activeTab !== 'tracking') return;
    
    const interval = setInterval(() => {
      fetch('/api/users')
        .then((res) => {
          if (res.ok) return res.json();
        })
        .then((data) => {
          if (data) {
            setUserList(data);
          }
        })
        .catch((err) => console.error("Telemetry fetch error:", err));
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setCharts(data.charts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUserList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Route
  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !destination || !distance || selectedStops.length === 0) {
      alert('Please enter source, destination, distance, and choose at least one stop.');
      return;
    }

    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          destination,
          distance,
          stopIds: selectedStops
        })
      });

      if (res.ok) {
        setRouteSuccess('New structural transit route defined!');
        setSource('');
        setDestination('');
        setDistance('');
        setSelectedStops([]);
        onRefreshRoutes();
        setTimeout(() => setRouteSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopToggle = (stopId: string) => {
    if (selectedStops.includes(stopId)) {
      setSelectedStops(selectedStops.filter(id => id !== stopId));
    } else {
      setSelectedStops([...selectedStops, stopId]);
    }
  };

  // Call Gemini Route Optimizer
  const runAiOptimizer = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    // Dynamic text sequence to enhance visual AI processing
    const prompts = [
      'Ingesting global passenger traffic datasets...',
      'Mapping transit bottleneck nodes on coordinates...',
      'Processing network state variables through AI models...',
      'Synthesizing traffic congestion mitigation pathways...',
      'Finalizing structural transit recommendations report...'
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < prompts.length - 1) {
        step++;
        setAiProgressText(prompts[step]);
      }
    }, 1500);

    try {
      const res = await fetch('/api/ai/optimize-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Optimization failed');
      
      setAiResult(data);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      clearInterval(interval);
      setAiLoading(false);
    }
  };

  const handleDownloadReport = () => {
    setDownloading(true);
    setDownloadSuccess(false);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Tab Menu Header */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-2xl max-w-4xl border border-slate-200">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 px-3 min-w-[120px] text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 size={14} />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-3 min-w-[120px] text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={14} />
          Manage Users
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex-1 py-2 px-3 min-w-[130px] text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'tracking'
              ? 'bg-slate-900 text-emerald-400 shadow-sm border border-slate-950 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Locate size={14} className={activeTab === 'tracking' ? 'animate-pulse text-emerald-400' : ''} />
          GPS Live Tracking
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`flex-1 py-2 px-3 min-w-[120px] text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'routes'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin size={14} />
          Route Builder
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 px-3 min-w-[120px] text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative overflow-hidden ${
            activeTab === 'ai'
              ? 'bg-indigo-900 text-white shadow-sm border border-indigo-950 font-bold'
              : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50'
          }`}
        >
          <Sparkles size={14} className={activeTab === 'ai' ? 'text-blue-300 animate-pulse' : 'text-indigo-600'} />
          AI Optimizer
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Key Metrics Row */}
          {!loadingAnalytics && metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="text-2xl font-black text-slate-900 font-mono">{metrics.passengerCount}</div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Commuters (Today)</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="text-2xl font-black text-slate-900 font-mono">{metrics.dailyTrips}</div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Daily Dispatches</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="text-2xl font-black text-slate-900 font-mono">{metrics.routeCount}</div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Total System Routes</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="text-2xl font-black text-slate-900 font-mono">⭐ {metrics.averageRating} / 5</div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Passenger Satisfaction</div>
              </div>
            </div>
          )}

          {/* Visual Reports & Chart Visualizers (SVG-driven) */}
          {!loadingAnalytics && charts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Traffic Bar Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Commuters Traffic (Weekly Segment)</h4>
                <div className="relative h-60 w-full flex items-end justify-between px-4 border-b border-slate-200 pb-2">
                  {charts.weeklyTraffic.map((day: any, idx: number) => {
                    const heightPercent = `${(day.passengers / 1600) * 100}%`;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5 w-1/12 group">
                        <div className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                          {day.passengers}
                        </div>
                        {/* Elegant SVG bar */}
                        <div
                          style={{ height: heightPercent }}
                          className="w-full bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-all shadow-sm"
                        ></div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">{day.day}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Route Usage Horizontal Bar Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Route Popularity Load Index</h4>
                <div className="space-y-3.5">
                  {charts.routeUsage.map((route: any, idx: number) => {
                    const pct = `${(route.passengers / 550) * 100}%`;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs text-slate-600">
                          <span className="font-bold truncate max-w-[200px]">{route.name}</span>
                          <span className="font-mono font-bold text-slate-800">{route.passengers} pax</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div style={{ width: pct }} className="h-full bg-indigo-600 rounded-full"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Export Center */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow text-white flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <FileSpreadsheet className="text-emerald-400" size={18} />
                System Reports Generating Center
              </h3>
              <p className="text-xs text-slate-400 mt-1">Export full diagnostic logs including system delays, commuter frequency index, fuel utilization, and operator compliance spreadsheets.</p>
            </div>
            {downloadSuccess ? (
              <span className="bg-emerald-900/40 border border-emerald-800 text-emerald-300 font-bold text-xs py-2 px-5 rounded-xl flex items-center gap-1">
                <Check size={14} />
                Full System Report Exported! (ZIP)
              </span>
            ) : (
              <button
                onClick={handleDownloadReport}
                disabled={downloading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 py-2.5 px-6 rounded-xl text-white text-xs font-bold font-sans transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-md"
              >
                {downloading ? 'Compiling Manifest files...' : 'Download Full System Report'}
                <Download size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE USERS */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registered Commuter & Operator Roster</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Revoke portal access by blocking operators or deleting expired records.</p>
            </div>
            <button 
              onClick={fetchUsers}
              className="p-1.5 hover:bg-slate-200 rounded transition-all text-slate-500"
              title="Reload User database"
            >
              <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Access Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {userList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{usr.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{usr.email}</td>
                    <td className="py-3.5 px-4 font-mono">{usr.phone || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        usr.role === 'ADMIN'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          : usr.role === 'OPERATOR'
                          ? 'bg-amber-50 border border-amber-200 text-amber-700'
                          : 'bg-blue-50 border border-blue-200 text-blue-700'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {usr.status === 'BLOCKED' ? (
                        <span className="inline-block text-[10px] bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-full font-bold">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => toggleUserStatus(usr.id, usr.status)}
                        disabled={usr.id === 'u3'} // Prevent blocking self
                        className={`text-[11px] font-bold px-2 py-1 rounded transition-all cursor-pointer active:scale-95 border ${
                          usr.status === 'ACTIVE'
                            ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                        }`}
                      >
                        {usr.status === 'ACTIVE' ? 'Block Access' : 'Activate User'}
                      </button>
                      <button
                        onClick={() => deleteUser(usr.id)}
                        disabled={usr.id === 'u3'} // Prevent deleting self
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-all cursor-pointer active:scale-90 inline-block align-middle"
                        title="Delete record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2.5: GPS LIVE USER TRACKING RADAR */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full animate-pulse">
                  System Admin Telemetry
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
                <Compass className="text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} size={20} />
                Live Commuter & Operator Tracking Radar
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Administrative security protocol is active. Track active commuter and crew coordinates, monitor real-time location vectors, and manage database profiles.
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchUsers}
                type="button"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <RefreshCw size={12} className={loadingUsers ? 'animate-spin' : ''} />
                Refresh Telemetry
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* SVG RADAR SCANNER MAP (8 cols) */}
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden h-[540px] flex flex-col justify-between">
              {/* Radar sweep lines & HUD */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle_at_center,_transparent_40%,_#10b981_100%)]"></div>
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(16,185,129,0.05)_1px,_transparent_1px)] bg-[size:40px_40px]"></div>

              {/* HUD Header */}
              <div className="z-10 flex justify-between items-center bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span>RADAR LOCK: ACTIVE SCANNING</span>
                </div>
                <div>
                  TOTAL NODES: <span className="text-emerald-400 font-bold">{userList.filter(u => u.role !== 'ADMIN').length}</span> COMMUTERS / CREW
                </div>
              </div>

              {/* Map SVG Canvas */}
              <div className="flex-1 w-full relative flex items-center justify-center my-3 min-h-0">
                <svg className="w-full h-full min-h-[360px] max-h-[440px]" viewBox="0 0 800 500">
                  {/* Grid circle indicators */}
                  <circle cx="400" cy="250" r="120" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4 6" className="opacity-15" />
                  <circle cx="400" cy="250" r="220" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3 4" className="opacity-10" />
                  <circle cx="400" cy="250" r="320" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 3" className="opacity-5" />
                  
                  {/* Draw route lines */}
                  {routes.map((route) => {
                    const points = route.stops.map((stop) => {
                      // Project each stop
                      const minLat = 40.6800;
                      const maxLat = 40.7700;
                      const minLng = -74.0500;
                      const maxLng = -73.9600;
                      const padding = 0.1;
                      const x = padding * 800 + ((stop.longitude - minLng) / (maxLng - minLng)) * 800 * (1 - 2 * padding);
                      const y = padding * 500 + (1 - (stop.latitude - minLat) / (maxLat - minLat)) * 500 * (1 - 2 * padding);
                      return `${x},${y}`;
                    }).join(' ');

                    const routeColors: Record<string, string> = {
                      r1: '#3b82f6',
                      r2: '#ef4444',
                      r3: '#10b981'
                    };

                    return (
                      <polyline
                        key={route.routeId}
                        points={points}
                        fill="none"
                        stroke={routeColors[route.routeId] || '#cbd5e1'}
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        className="opacity-20"
                      />
                    );
                  })}

                  {/* Draw stops */}
                  {stops.map((stop) => {
                    const minLat = 40.6800;
                    const maxLat = 40.7700;
                    const minLng = -74.0500;
                    const maxLng = -73.9600;
                    const padding = 0.1;
                    const x = padding * 800 + ((stop.longitude - minLng) / (maxLng - minLng)) * 800 * (1 - 2 * padding);
                    const y = padding * 500 + (1 - (stop.latitude - minLat) / (maxLat - minLat)) * 500 * (1 - 2 * padding);

                    return (
                      <g key={stop.stopId} className="opacity-30">
                        <circle cx={x} cy={y} r="3" fill="#cbd5e1" />
                        <text x={x + 5} y={y + 3} className="fill-slate-500 font-mono text-[8px]" pointerEvents="none">
                          {stop.stopName.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw live buses */}
                  {buses.map((bus) => {
                    const minLat = 40.6800;
                    const maxLat = 40.7700;
                    const minLng = -74.0500;
                    const maxLng = -73.9600;
                    const padding = 0.1;
                    const x = padding * 800 + ((bus.currentLng - minLng) / (maxLng - minLng)) * 800 * (1 - 2 * padding);
                    const y = padding * 500 + (1 - (bus.currentLat - minLat) / (maxLat - minLat)) * 500 * (1 - 2 * padding);

                    return (
                      <g key={bus.busId}>
                        <circle cx={x} cy={y} r="7" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
                        <text x={x} y={y + 3} className="fill-blue-400 font-mono text-[7px] text-center font-bold" textAnchor="middle" pointerEvents="none">
                          🚌
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw live users */}
                  {userList.map((usr) => {
                    if (usr.role === 'ADMIN' || !usr.latitude || !usr.longitude) return null;
                    const minLat = 40.6800;
                    const maxLat = 40.7700;
                    const minLng = -74.0500;
                    const maxLng = -73.9600;
                    const padding = 0.1;
                    const x = padding * 800 + ((usr.longitude - minLng) / (maxLng - minLng)) * 800 * (1 - 2 * padding);
                    const y = padding * 500 + (1 - (usr.latitude - minLat) / (maxLat - minLat)) * 500 * (1 - 2 * padding);

                    const isSelected = selectedTrackedUserId === usr.id;
                    const isBlocked = usr.status === 'BLOCKED';
                    const isOperator = usr.role === 'OPERATOR';

                    let color = '#3b82f6'; // blue passenger
                    if (isBlocked) color = '#ef4444'; // red blocked
                    else if (isOperator) color = '#f59e0b'; // amber operator

                    return (
                      <g 
                        key={usr.id} 
                        onClick={() => setSelectedTrackedUserId(usr.id)} 
                        className="cursor-pointer group"
                      >
                        {/* Selected Pulsing Ring */}
                        {isSelected && (
                          <circle cx={x} cy={y} r="14" fill="none" stroke={color} strokeWidth="2" className="animate-pulse" />
                        )}
                        <circle cx={x} cy={y} r="10" fill="none" stroke={color} strokeWidth="1" className="opacity-20 group-hover:opacity-100 transition-opacity" />
                        {/* Core Dot */}
                        <circle cx={x} cy={y} r="5" fill={color} stroke="#020617" strokeWidth="1" />
                        
                        {/* Hover tag */}
                        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" pointerEvents="none">
                          <rect x={x - 40} y={y - 28} width="80" height="15" rx="3" fill="#0f172a" stroke={color} strokeWidth="1" />
                          <text x={x} y={y - 18} className="fill-slate-200 font-bold text-[8px]" textAnchor="middle">
                            {usr.name}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legend overlay */}
              <div className="z-10 flex flex-wrap gap-4 text-[10px] font-mono text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 self-start">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Passenger Commuter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Transit Operator</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span>Blocked / Suspended</span>
                </div>
              </div>
            </div>

            {/* SELECTION DETAIL PANEL & TRACKING ROSTER (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Selected User Detail Card */}
              {(() => {
                const selectedUser = userList.find(u => u.id === selectedTrackedUserId);
                if (!selectedUser) {
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 shadow-sm">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
                        <Locate className="text-slate-400" size={20} />
                      </div>
                      <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">No Telemetry Focused</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Select an active node from the telemetry map radar or list below to track coordinates and manage database authorizations.
                      </p>
                    </div>
                  );
                }

                const isBlocked = selectedUser.status === 'BLOCKED';

                return (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase font-mono tracking-wider ${
                          selectedUser.role === 'OPERATOR'
                            ? 'bg-amber-50 border border-amber-200 text-amber-700'
                            : 'bg-blue-50 border border-blue-200 text-blue-700'
                        }`}>
                          {selectedUser.role}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{selectedUser.name}</h4>
                        <p className="text-[10px] font-mono text-slate-400">{selectedUser.id}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ONLINE
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                        <span className="font-mono font-medium text-slate-800">{selectedUser.email}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone</span>
                        <span className="font-mono text-slate-600">{selectedUser.phone || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Latitude</span>
                          <span className="text-[11px] font-bold text-slate-700">{selectedUser.latitude?.toFixed(5) || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Longitude</span>
                          <span className="text-[11px] font-bold text-slate-700">{selectedUser.longitude?.toFixed(5) || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>Last GPS Refresh:</span>
                        <span className="font-mono text-slate-500">
                          {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleTimeString() : 'Just now'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => toggleUserStatus(selectedUser.id, selectedUser.status)}
                        type="button"
                        className={`py-2 text-[11px] font-bold rounded-xl transition-all border cursor-pointer active:scale-95 text-center ${
                          isBlocked
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                            : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
                        }`}
                      >
                        {isBlocked ? 'Unlock User' : 'Block Access'}
                      </button>
                      <button
                        onClick={() => {
                          deleteUser(selectedUser.id);
                          setSelectedTrackedUserId(null);
                        }}
                        type="button"
                        className="py-2 text-[11px] font-bold bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1"
                      >
                        <Trash2 size={11} />
                        Delete User
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Roster sidebar list */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[230px]">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Interactive Live Nodes</h4>
                  <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">
                    {userList.filter(u => u.role !== 'ADMIN').length}
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                  {userList
                    .filter(u => u.role !== 'ADMIN')
                    .map((usr) => {
                      const isSelected = selectedTrackedUserId === usr.id;
                      const isBlocked = usr.status === 'BLOCKED';
                      let colorClass = 'bg-blue-500';
                      if (isBlocked) colorClass = 'bg-red-500';
                      else if (usr.role === 'OPERATOR') colorClass = 'bg-amber-500';

                      return (
                        <div
                          key={usr.id}
                          onClick={() => setSelectedTrackedUserId(usr.id)}
                          className={`p-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-xs ${
                            isSelected ? 'bg-slate-50 border-l-2 border-slate-900 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${colorClass} ${!isBlocked ? 'animate-pulse' : ''}`}></span>
                            <div>
                              <div className="font-bold text-slate-800">{usr.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{usr.role} • {usr.email.split('@')[0]}</div>
                            </div>
                          </div>
                          <button
                            className="text-[10px] text-slate-500 hover:text-slate-900 font-mono bg-slate-100 hover:bg-slate-200 px-1.5 py-1 rounded transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrackedUserId(usr.id);
                            }}
                          >
                            LOCATE
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROUTE BUILDER */}
      {activeTab === 'routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Route Form */}
          <form onSubmit={handleAddRoute} className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus size={16} className="text-blue-600" />
              Build Structural Transit Route
            </h3>

            {routeSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                {routeSuccess}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Source Terminal Name</label>
              <input
                type="text"
                placeholder="e.g. Westside Docks"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Destination Terminal Name</label>
              <input
                type="text"
                placeholder="e.g. East Bay Terminal"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Route Distance (km)</label>
              <input
                type="text"
                placeholder="e.g. 12.4 km"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Sequence of Stops (Nodes)</label>
              <div className="border border-slate-200 rounded-xl max-h-36 overflow-y-auto p-2 bg-slate-50 space-y-1.5">
                {stops.map(stop => {
                  const isChecked = selectedStops.includes(stop.stopId);
                  return (
                    <label key={stop.stopId} className="flex items-center gap-2 text-xs font-sans text-slate-700 hover:text-slate-900 cursor-pointer p-1 rounded hover:bg-slate-100">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleStopToggle(stop.stopId)}
                        className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>{stop.stopName}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 transition-all"
            >
              <Plus size={14} />
              Publish Transit Route
            </button>
          </form>

          {/* Routes Sequence List */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Defined Network Routes</h4>
            </div>

            <div className="p-4 space-y-3 max-h-[460px] overflow-y-auto">
              {routes.map(route => (
                <div key={route.routeId} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-blue-100 border border-blue-200 text-blue-800 px-2 py-0.5 rounded">
                        ROUTE: {route.routeId}
                      </span>
                      <span className="text-xs text-slate-500 font-mono font-bold">{route.distance}</span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-900 mt-1.5">
                      {route.source} ⇌ {route.destination}
                    </h5>

                    {/* Stops List */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {route.stops.map((stop, sidx) => (
                        <span key={stop.stopId} className="text-[10px] bg-white border border-slate-100 rounded px-2 py-0.5 text-slate-500 flex items-center gap-1">
                          <MapPin size={9} className="text-blue-500" />
                          {stop.stopName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GEMINI AI ROUTE OPTIMIZER */}
      {activeTab === 'ai' && (
        <div className="bg-slate-950 border border-indigo-950 rounded-2xl p-6 shadow-2xl text-white space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 flex items-center gap-2">
                <Sparkles size={22} className="text-indigo-400 animate-pulse" />
                Gemini Transit AI Optimization Core
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Invokes the AI optimization engine which compiles current network routes, delay factors, and driver rosters to isolate and resolve system inefficiencies.
              </p>
            </div>
            
            <button
              onClick={runAiOptimizer}
              disabled={aiLoading}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:bg-slate-800 py-3 px-6 rounded-xl text-white text-xs font-bold font-sans tracking-wide shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer border border-indigo-400/20"
            >
              {aiLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-blue-300" />
                  Generating AI Analysis...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-blue-300" />
                  Run AI Route Optimization
                </>
              )}
            </button>
          </div>

          {/* Processing Screen */}
          {aiLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                {/* Rotating holographic glows */}
                <div className="w-16 h-16 rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-blue-500 border-l-slate-800 animate-spin"></div>
                <Sparkles size={20} className="absolute inset-0 m-auto text-blue-300 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-slate-200 font-mono">{aiProgressText}</div>
                <div className="text-xs text-slate-500 font-sans">Connecting to AI optimization engine. Please stand by...</div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {aiError && (
            <div className="p-4 bg-red-950/40 border border-red-900 text-red-200 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">AI Processing Error:</span> {aiError}
              </div>
            </div>
          )}

          {/* AI Result Report Board */}
          {aiResult && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* High level Summary Statement (8 cols) */}
                <div className="md:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Executive Optimization Summary</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiResult.summary}</p>
                </div>

                {/* Score Index circle gauge (4 cols) */}
                <div className="md:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col items-center justify-center text-center">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono mb-4">Grid Efficiency Index</h4>
                  <div className="relative flex items-center justify-center">
                    <svg width="100" height="100" className="rotate-[-90deg]">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="none" 
                        stroke="#818cf8" 
                        strokeWidth="8" 
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * aiResult.efficiencyScore) / 100}
                      />
                    </svg>
                    <span className="absolute text-xl font-black text-slate-100 font-mono">{aiResult.efficiencyScore}%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-3 uppercase font-bold tracking-wider">Calculated network efficiency score</span>
                </div>
              </div>

              {/* Suggestions Data Table */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Structural Re-routing Recommendations</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiResult.recommendations.map((rec, rIdx) => (
                    <div key={rIdx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                      <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-mono bg-indigo-950 border border-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded">
                          ROUTE: {rec.routeId}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold font-mono">
                          {rec.expectedImpact}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-300 font-mono">Route Identifier:</h5>
                        <p className="text-xs text-slate-100 font-semibold">{rec.routeName}</p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-red-400 font-mono">Detected Bottleneck / Issue:</h5>
                        <p className="text-xs text-slate-300 italic leading-relaxed">"{rec.issue}"</p>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-slate-800">
                        <h5 className="text-xs font-bold text-indigo-300 font-mono flex items-center gap-1">
                          <Sparkles size={11} />
                          AI Suggested Optimization:
                        </h5>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">{rec.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Initial default guidance state */}
          {!aiResult && !aiLoading && (
            <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
              <Sparkles size={28} className="text-indigo-900" />
              <div>Click the button above to execute the AI Optimizer models on active routes and coordinates.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
