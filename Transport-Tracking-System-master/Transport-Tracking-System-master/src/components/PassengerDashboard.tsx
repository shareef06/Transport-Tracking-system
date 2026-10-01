/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bus, Route, Stop, Feedback, Notification, TravelHistory, User } from '../types';
import MapTracker from './MapTracker';
import { 
  Search, Star, Bell, History, MessageSquare, AlertOctagon, Navigation, Check,
  Clock, MapPin, Send, HelpCircle, ShieldAlert 
} from 'lucide-react';

interface PassengerDashboardProps {
  user: User;
  buses: Bus[];
  routes: Route[];
  stops: Stop[];
  notifications: Notification[];
  onRefreshBuses: () => void;
}

export default function PassengerDashboard({
  user,
  buses,
  routes,
  stops,
  notifications,
  onRefreshBuses
}: PassengerDashboardProps) {
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'history' | 'feedback'>('schedule');

  // Feedback fields
  const [rating, setRating] = useState(5);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Travel history
  const [history, setHistory] = useState<TravelHistory[]>([]);

  // Favorite routes local state (synchronized with API)
  const [favorites, setFavorites] = useState<Route[]>([]);

  // Emergency SOS state
  const [sosActive, setSosActive] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosResponse, setSosResponse] = useState<{ nearestBus?: string; nearestStop?: string; selectedBus?: string } | null>(null);

  // Selected bus info for SOS panel
  const selectedBus = selectedBusId ? buses.find(b => b.busId === selectedBusId) : null;
  const selectedBusRoute = selectedBus ? routes.find(r => r.routeId === selectedBus.routeId) : null;

  // Web Audio refs for emergency siren sound (exclusively yelp sound style)
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const oscillatorRef = React.useRef<OscillatorNode | null>(null);
  const gainRef = React.useRef<GainNode | null>(null);
  const alarmIntervalRef = React.useRef<any>(null);

  const startAlarm = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Configure oscillator type and initial frequency for Yelp siren style
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime); // Keep volume moderate but audible

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainRef.current = gain;

      // Set the rapid yelp sweep timing loop (200ms sweep cycles)
      let count = 0;
      const intervalMs = 200;

      alarmIntervalRef.current = setInterval(() => {
        if (!oscillatorRef.current || !audioCtxRef.current) return;
        const currentCtx = audioCtxRef.current;
        const now = currentCtx.currentTime;

        // Rapid sweep (yelp) between 600Hz and 1300Hz over 0.2s
        const nextFreq = count % 2 === 0 ? 1300 : 600;
        oscillatorRef.current.frequency.cancelScheduledValues(now);
        oscillatorRef.current.frequency.setValueAtTime(oscillatorRef.current.frequency.value, now);
        oscillatorRef.current.frequency.linearRampToValueAtTime(nextFreq, now + 0.18);
        count++;
      }, intervalMs);

    } catch (e) {
      console.error("Failed to start SOS audio alarm:", e);
    }
  };

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
        gainRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {
      console.error("Failed to stop SOS audio alarm:", e);
    }
  };

  // Send SOS alert to backend when triggered
  const triggerSos = async () => {
    setSosSending(true);
    try {
      const userLat = user.latitude || 40.7128;
      const userLng = user.longitude || -74.0060;
      
      const body: Record<string, any> = {
        userId: user.id,
        userName: user.name,
        latitude: userLat,
        longitude: userLng,
        message: selectedBusId
          ? `Emergency SOS from passenger aboard ${selectedBus?.busNumber} (${selectedBusRoute?.source || ''} ⇌ ${selectedBusRoute?.destination || ''})`
          : 'Emergency SOS activated by passenger.'
      };
      
      // Include selected bus info if user clicked on a bus
      if (selectedBus) {
        body.busId = selectedBus.busId;
        body.busNumber = selectedBus.busNumber;
        body.busType = selectedBus.busType;
        body.routeInfo = selectedBusRoute ? `${selectedBusRoute.source} ⇌ ${selectedBusRoute.destination}` : 'Unknown';
      }
      
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        const alert = data.alert;
        
        // Show selected bus info in response, or fallback to nearest bus from server
        const responseObj: any = {
          nearestBus: alert.nearestBus ? `${alert.nearestBus.busNumber} (${alert.nearestBus.distance})` : undefined,
          nearestStop: alert.nearestStop ? `${alert.nearestStop.stopName} (${alert.nearestStop.distance})` : undefined
        };
        
        if (selectedBus) {
          responseObj.selectedBus = `${selectedBus.busNumber} - ${selectedBus.busType} (${selectedBusRoute?.source || ''} ⇌ ${selectedBusRoute?.destination || ''})`;
        }
        
        setSosResponse(responseObj);
        setSosSent(true);
        setSosActive(true);
      }
    } catch (e) {
      console.error('Failed to send SOS:', e);
    } finally {
      setSosSending(false);
    }
  };

  const cancelSos = async () => {
    setSosActive(false);
    setSosSent(false);
    setSosResponse(null);
  };

  // Synchronize audio alarm with sosActive state
  useEffect(() => {
    if (sosActive) {
      stopAlarm();
      startAlarm();
    } else {
      stopAlarm();
    }
    return () => {
      stopAlarm();
    };
  }, [sosActive]);

  // Fetch initial data
  useEffect(() => {
    fetchFavorites();
    fetchFeedbacks();
    fetchHistory();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`/api/favorites/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/history/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFavorite = async (routeId: string) => {
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId })
      });
      if (res.ok) {
        fetchFavorites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          message: feedbackMsg,
          rating
        })
      });
      if (res.ok) {
        setFeedbackMsg('');
        setRating(5);
        setFeedbackSuccess(true);
        fetchFeedbacks();
        setTimeout(() => setFeedbackSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter routes and buses based on search
  const filteredRoutes = routes.filter((r) => {
    const term = searchQuery.toLowerCase();
    return (
      r.source.toLowerCase().includes(term) ||
      r.destination.toLowerCase().includes(term)
    );
  });

  const filteredBuses = buses.filter((b) => {
    const term = searchQuery.toLowerCase();
    const route = routes.find((r) => r.routeId === b.routeId);
    return (
      b.busNumber.toLowerCase().includes(term) ||
      (route && (route.source.toLowerCase().includes(term) || route.destination.toLowerCase().includes(term)))
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Search Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Passenger Transit Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track active buses, search route sequences, and view real-time delays.</p>
        </div>
        <div className="relative max-w-md w-full">
          <span className="absolute left-3.5 top-3 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by Bus #, Source, or Destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Main Track Layout (Map left, HUD right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive GIS Map */}
        <div className="lg:col-span-8 space-y-4">
          <MapTracker
            buses={buses}
            routes={routes}
            stops={stops}
            selectedBusId={selectedBusId}
            onSelectBus={(id) => setSelectedBusId(id)}
          />

          {/* Quick Route Favorite Stars Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              Quick Save Favorite Routes
            </h4>
            <div className="flex flex-wrap gap-2">
              {routes.map((route) => {
                const isFav = favorites.some((f) => f.routeId === route.routeId);
                return (
                  <button
                    key={route.routeId}
                    onClick={() => toggleFavorite(route.routeId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isFav
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Star size={13} fill={isFav ? '#d97706' : 'none'} className={isFav ? 'text-amber-600' : 'text-slate-400'} />
                    {route.source} ⇌ {route.destination}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Transit Monitor (Right Sidebar) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Buses list with Locator */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-blue-400 animate-pulse" />
                <h3 className="font-bold text-sm">Active Bus HUD</h3>
              </div>
              <button 
                onClick={onRefreshBuses}
                className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 active:scale-95 transition-all"
              >
                Refresh Coordinates
              </button>
            </div>

            <div className="p-3 space-y-2.5 max-h-[310px] overflow-y-auto">
              {filteredBuses.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No active buses match your query.
                </div>
              ) : (
                filteredBuses.map((bus) => {
                  const r = routes.find((rt) => rt.routeId === bus.routeId);
                  const isSelected = bus.busId === selectedBusId;
                  return (
                    <div
                      key={bus.busId}
                      className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-600/60'
                          : 'bg-slate-800/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-200 text-sm">{bus.busNumber}</span>
                            <span className="text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                              {bus.busType}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {r ? `${r.source} ⇌ ${r.destination}` : 'Unassigned'}
                          </div>
                        </div>

                        {bus.status === 'DELAYED' ? (
                          <span className="text-[10px] font-mono font-bold bg-red-950/50 border border-red-800/60 text-red-300 px-2 py-0.5 rounded-full">
                            +{bus.delayMinutes}m delay
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 px-2 py-0.5 rounded-full">
                            On Time
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-300">
                        <div className="flex items-center gap-1 text-slate-400 font-mono">
                          <Clock size={12} />
                          ETA: <span className="text-slate-200 font-bold">~{bus.etaMinutes || 5}m</span>
                        </div>
                        <button
                          onClick={() => setSelectedBusId(bus.busId)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <Navigation size={10} className="rotate-45" />
                          Track Live
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SOS Emergency Module */}
          <div className={`rounded-2xl p-5 shadow-sm border transition-all ${
            sosActive
              ? 'bg-red-900/90 border-red-700 text-white'
              : sosSent
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <h4 className="text-sm font-bold flex items-center gap-1.5 mb-1.5">
              <AlertOctagon className="shrink-0" size={18} />
              Emergency SOS Beacon
            </h4>
            
            {sosSent && sosResponse ? (
              <>
                <div className="text-xs mb-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <Check size={14} />
                    Alert sent to dispatch center!
                  </div>
                  {sosResponse.selectedBus && (
                    <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100/50 p-2 rounded-lg border border-emerald-200">
                      <Navigation size={12} className="shrink-0" />
                      <span>Your Bus: <strong>{sosResponse.selectedBus}</strong></span>
                    </div>
                  )}
                  {sosResponse.nearestStop && (
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <MapPin size={12} />
                      <span>Near: <strong>{sosResponse.nearestStop}</strong></span>
                    </div>
                  )}
                  {sosResponse.nearestBus && (
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <Navigation size={12} />
                      <span>Closest Bus: <strong>{sosResponse.nearestBus}</strong></span>
                    </div>
                  )}
                </div>
                {sosActive ? (
                  <button
                    onClick={cancelSos}
                    className="w-full py-2.5 bg-red-700 hover:bg-red-800 active:scale-95 transition-all text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/30 cursor-pointer text-center uppercase animate-pulse border border-red-900 flex items-center justify-center gap-2"
                  >
                    <span>🚨 STOP SOS ALARM (ACTIVE)</span>
                  </button>
                ) : (
                  <button
                    onClick={triggerSos}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/20 cursor-pointer text-center uppercase border border-red-700 flex items-center justify-center gap-2"
                  >
                    Trigger SOS Alarm
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-red-700 leading-relaxed mb-3">
                  Are you currently experiencing an emergency situation at a stop or aboard a bus? Instantly notify dispatch with your exact GPS coordinates and nearest vehicle.
                </p>

                {/* Selected Bus Info - shows when user clicks a bus on the map */}
                {selectedBus && !sosSent && (
                  <div className="mb-3 p-3 bg-white/10 border border-red-300/20 rounded-xl space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-red-600 tracking-wider flex items-center gap-1">
                      <Navigation size={12} />
                      Your Selected Bus
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-red-800">{selectedBus.busNumber}</span>
                      <span className="text-[10px] font-mono bg-red-200/50 border border-red-300/50 text-red-700 px-1.5 py-0.5 rounded">
                        {selectedBus.busType}
                      </span>
                    </div>
                    <div className="text-[11px] text-red-700 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Route:</span>
                        <span className="font-semibold">{selectedBusRoute ? `${selectedBusRoute.source} ⇌ ${selectedBusRoute.destination}` : 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Stop:</span>
                        <span className="font-semibold">{stops.find(s => s.stopId === selectedBus.nextStopId)?.stopName || 'Terminal'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ETA:</span>
                        <span className="font-semibold">~{selectedBus.etaMinutes || 5} mins</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Driver:</span>
                        <span className="font-semibold">{selectedBus.driverName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-red-300/30">
                        <span>Status:</span>
                        {selectedBus.status === 'DELAYED' ? (
                          <span className="font-semibold text-red-800">DELAYED (+{selectedBus.delayMinutes}m)</span>
                        ) : (
                          <span className="font-semibold text-emerald-700">ON TIME</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {sosSending ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-red-400 text-white font-bold text-xs rounded-xl cursor-not-allowed text-center uppercase flex items-center justify-center gap-2"
                  >
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Sending SOS Alert...
                  </button>
                ) : (
                  <button
                    onClick={triggerSos}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/20 cursor-pointer text-center uppercase border border-red-700 flex items-center justify-center gap-2"
                  >
                    <AlertOctagon size={14} />
                    Trigger SOS Alarm
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delay Notifications Marquee alert */}
      {notifications.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <Bell size={16} className="text-amber-600 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <span className="font-bold text-amber-800">Alert Center:</span> {notifications[0].title} - {notifications[0].message}
          </div>
        </div>
      )}

      {/* Tabs Menu (Schedule, History, Feedback) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`flex-1 sm:flex-none px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeSubTab === 'schedule'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock size={14} />
            Transit Schedules
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 sm:flex-none px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeSubTab === 'history'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <History size={14} />
            Travel History
          </button>
          <button
            onClick={() => setActiveSubTab('feedback')}
            className={`flex-1 sm:flex-none px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeSubTab === 'feedback'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <MessageSquare size={14} />
            Feedback Board
          </button>
        </div>

        <div className="p-6">
          {/* Schedule Subtab */}
          {activeSubTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Active Network Routes</h3>
                <span className="text-[11px] text-slate-400 font-mono">Showing {filteredRoutes.length} route segments</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredRoutes.map((route) => (
                  <div key={route.routeId} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        ID: {route.routeId}
                      </span>
                      <span className="text-xs text-slate-500 font-mono font-bold">{route.distance}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {route.source} ⇌ {route.destination}
                      </h4>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Stops Sequence</div>
                      <div className="space-y-1.5 pl-2 border-l border-blue-400">
                        {route.stops.map((stop, sidx) => (
                          <div key={stop.stopId} className="text-xs flex items-center gap-1.5 text-slate-700">
                            <MapPin size={10} className="text-blue-500 shrink-0" />
                            <span className="truncate">{stop.stopName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Subtab */}
          {activeSubTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Trip Date</th>
                    <th className="py-3 px-4">Bus #</th>
                    <th className="py-3 px-4">Route Assignment</th>
                    <th className="py-3 px-4 text-right">Fare Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {history.map((hist) => (
                    <tr key={hist.historyId} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold">{hist.date}</td>
                      <td className="py-3.5 px-4 font-bold">{hist.busNumber}</td>
                      <td className="py-3.5 px-4">{hist.routeTitle}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{hist.fare}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Feedback Subtab */}
          {activeSubTab === 'feedback' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Form (5 cols) */}
              <form onSubmit={handleFeedbackSubmit} className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-800">Submit Service Review</h4>
                {feedbackSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold">
                    Feedback submitted successfully!
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-amber-500 p-0.5 cursor-pointer active:scale-90 transition-all"
                      >
                        <Star size={20} fill={star <= rating ? '#f59e0b' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Review Comments</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your transit experience..."
                    value={feedbackMsg}
                    onChange={(e) => setFeedbackMsg(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer active:scale-95"
                >
                  <Send size={12} />
                  Post Review
                </button>
              </form>

              {/* Scrolling Board (7 cols) */}
              <div className="md:col-span-7 space-y-3 max-h-[300px] overflow-y-auto pr-2">
                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-1">Historic Passengers Reviews</h4>
                {feedbacks.map((item) => (
                  <div key={item.feedbackId} className="p-3 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700">{item.userName}</span>
                      <span className="text-slate-400 font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, sidx) => (
                        <Star key={sidx} size={11} fill={sidx < item.rating ? '#f59e0b' : 'none'} className="text-amber-500" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 italic">"{item.message}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
