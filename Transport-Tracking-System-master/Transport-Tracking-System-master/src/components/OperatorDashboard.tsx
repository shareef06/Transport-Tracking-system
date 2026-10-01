/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bus, Route, Stop, Driver, User, Notification, SOSAlert } from '../types';
import MapTracker from './MapTracker';
import { 
  Bus as BusIcon, UserCheck, ShieldAlert, Plus, Radio, AlertTriangle, Play,
  Settings, Save, Trash2, Calendar, Clipboard, CheckCircle, Navigation, ChevronRight,
  AlertOctagon, MapPin, Clock, Check, Locate, User as UserIcon
} from 'lucide-react';

interface OperatorDashboardProps {
  user: User;
  buses: Bus[];
  routes: Route[];
  stops: Stop[];
  drivers: Driver[];
  notifications: Notification[];
  onRefreshBuses: () => void;
  onRefreshDrivers: () => void;
}

export default function OperatorDashboard({
  user,
  buses,
  routes,
  stops,
  drivers,
  notifications,
  onRefreshBuses,
  onRefreshDrivers
}: OperatorDashboardProps) {
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'control' | 'fleet' | 'drivers'>('control');

  // --- MANUAL DISPATCH CONTROLLER STATE ---
  const [targetBusId, setTargetBusId] = useState('');
  const [busStatus, setBusStatus] = useState<'ON_ROUTE' | 'DELAYED' | 'TERMINATED' | 'MAINTENANCE'>('ON_ROUTE');
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // --- FLEET CRUD STATE ---
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newBusType, setNewBusType] = useState<'NORMAL' | 'EXPRESS' | 'DOUBLE_DECKER' | 'ELECTRIC'>('NORMAL');
  const [newCapacity, setNewCapacity] = useState(50);
  const [newDriverId, setNewDriverId] = useState('');
  const [newRouteId, setNewRouteId] = useState('');
  const [fleetSuccess, setFleetSuccess] = useState<string | null>(null);

  // --- SOS ALERTS STATE ---
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [sosAlertCount, setSosAlertCount] = useState(0);
  const [previousSosCount, setPreviousSosCount] = useState(0);
  const [sosFlash, setSosFlash] = useState(false);

  // Fetch SOS alerts periodically
  useEffect(() => {
    fetchSosAlerts();
    const interval = setInterval(fetchSosAlerts, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchSosAlerts = async () => {
    try {
      const res = await fetch('/api/sos?active=true');
      if (res.ok) {
        const data = await res.json();
        setSosAlerts(data);
        if (data.length > previousSosCount) {
          setSosAlertCount(prev => prev + 1);
          setSosFlash(true);
          setTimeout(() => setSosFlash(false), 3000);
        }
        setPreviousSosCount(data.length);
      }
    } catch (e) {
      console.error('Error fetching SOS alerts:', e);
    }
  };

  const resolveSos = async (sosId: string) => {
    try {
      const res = await fetch(`/api/sos/${sosId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        fetchSosAlerts();
      }
    } catch (e) {
      console.error('Error resolving SOS:', e);
    }
  };

  // --- DRIVER REGISTER STATE ---
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [driverSuccess, setDriverSuccess] = useState<string | null>(null);

  // Auto-fill Dispatch Controls when bus clicked on map
  useEffect(() => {
    if (selectedBusId) {
      const bus = buses.find(b => b.busId === selectedBusId);
      if (bus) {
        setTargetBusId(bus.busId);
        setBusStatus(bus.status);
        setDelayMinutes(bus.delayMinutes);
      }
    }
  }, [selectedBusId]);

  // Handle Quick Dispatch Overrides
  const handleDispatchUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBusId) return;

    try {
      const res = await fetch(`/api/buses/${targetBusId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: busStatus,
          delayMinutes
        })
      });

      if (res.ok) {
        setDispatchSuccess('Bus coordinates updated successfully!');
        onRefreshBuses();
        
        // If they declared a delay, automatically trigger a delay broadcast notice!
        if (busStatus === 'DELAYED' && broadcastMsg.trim()) {
          await fetch('/api/notifications/delay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              busId: targetBusId,
              title: broadcastTitle || `Delay update on ${buses.find(b => b.busId === targetBusId)?.busNumber}`,
              message: broadcastMsg
            })
          });
          setBroadcastMsg('');
          setBroadcastTitle('');
        }

        setTimeout(() => setDispatchSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Adding New Bus
  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusNumber || !newDriverId || !newRouteId) return;

    try {
      const res = await fetch('/api/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busNumber: newBusNumber,
          busType: newBusType,
          capacity: newCapacity,
          driverId: newDriverId,
          routeId: newRouteId
        })
      });

      if (res.ok) {
        setFleetSuccess('New transit bus added to fleet database!');
        setNewBusNumber('');
        setNewCapacity(50);
        onRefreshBuses();
        onRefreshDrivers();
        setTimeout(() => setFleetSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Driver Registration
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverPhone || !licenseNumber) return;

    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName,
          phone: driverPhone,
          licenseNumber
        })
      });

      if (res.ok) {
        setDriverSuccess('Driver profile compiled successfully!');
        setDriverName('');
        setDriverPhone('');
        setLicenseNumber('');
        onRefreshDrivers();
        setTimeout(() => setDriverSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dispatch metrics
  const activeFleet = buses.filter(b => b.status === 'ON_ROUTE').length;
  const delayedFleet = buses.filter(b => b.status === 'DELAYED').length;
  const totalRoster = drivers.length;
  const averageDelay = Math.round(buses.reduce((acc, curr) => acc + curr.delayMinutes, 0) / (buses.length || 1));

  return (
    <div className="space-y-6 font-sans">
      {/* Operator Dashboard Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
            <BusIcon size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{activeFleet} / {buses.length}</div>
            <div className="text-xs text-slate-500 font-medium">Buses Active on Route</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{delayedFleet}</div>
            <div className="text-xs text-slate-500 font-medium">Buses Delayed Today</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalRoster}</div>
            <div className="text-xs text-slate-500 font-medium">Total Registered Drivers</div>
          </div>
        </div>

        {/* Metric 4 - SOS Alerts */}
        <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-all ${
          sosAlerts.length > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-slate-200'
        }`}>
          <div className={`p-3 rounded-xl ${
            sosAlerts.length > 0
              ? 'bg-red-100 border border-red-200 text-red-600'
              : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
          }`}>
            <AlertOctagon size={24} className={sosAlerts.length > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className={`text-2xl font-bold ${sosAlerts.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>
              {sosAlerts.length > 0 ? (
                <span className="flex items-center gap-2">
                  {sosAlerts.length}
                  <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    ACTIVE
                  </span>
                </span>
              ) : '0'}
            </div>
            <div className={`text-xs font-medium ${sosAlerts.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>
              Active SOS Emergencies
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu (Control HUD, Fleet Management, Driver Registry) */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-1 rounded-xl max-w-lg">
        <button
          onClick={() => setActiveTab('control')}
          className={`flex-1 py-2.5 text-center font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'control'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Radio size={14} />
          Control Center
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex-1 py-2.5 text-center font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'fleet'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BusIcon size={14} />
          Manage Fleet
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex-1 py-2.5 text-center font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'drivers'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck size={14} />
          Manage Drivers
        </button>
      </div>

      {/* TAB 1: CONTROL CENTER */}
      {activeTab === 'control' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SOS Emergency Banner - shown when active alerts exist */}
          {sosAlerts.length > 0 && (
            <div className={`lg:col-span-12 w-full rounded-2xl border p-4 transition-all ${
              sosFlash ? 'bg-red-900/90 border-red-700 animate-pulse' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${sosFlash ? 'bg-red-800' : 'bg-red-100'}`}>
                    <AlertOctagon size={22} className={sosFlash ? 'text-red-300' : 'text-red-600'} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm flex items-center gap-2 ${sosFlash ? 'text-red-100' : 'text-red-900'}`}>
                      🚨 {sosAlerts.length} Active SOS Alert{sosAlerts.length > 1 ? 's' : ''}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        sosFlash ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800'
                      }`}>
                        EMERGENCY
                      </span>
                    </h3>
                    <p className={`text-xs mt-0.5 ${sosFlash ? 'text-red-200' : 'text-red-700'}`}>
                      Passenger emergency detected — dispatch nearest available unit immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* SOS Alert Cards */}
              <div className="mt-4 space-y-3">
                {sosAlerts.map((alert) => (
                  <div key={alert.sosId} className={`rounded-xl p-4 border ${
                    sosFlash ? 'bg-red-950/60 border-red-800' : 'bg-white border-red-100'
                  } shadow-sm`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2.5">
                        {/* Passenger Info */}
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            sosFlash ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-700'
                          }`}>
                            {alert.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className={`font-bold text-sm ${sosFlash ? 'text-red-100' : 'text-slate-900'}`}>
                              {alert.userName}
                            </span>
                            <span className={`text-[10px] font-mono block ${sosFlash ? 'text-red-300' : 'text-slate-400'}`}>
                              ID: {alert.userId} • {new Date(alert.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        {/* Location & Area Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Coordinates */}
                          <div className={`p-2.5 rounded-lg text-xs font-mono ${
                            sosFlash ? 'bg-red-950/40 border border-red-800/40' : 'bg-slate-50 border border-slate-200'
                          }`}>
                            <span className={`block text-[10px] font-bold uppercase tracking-wider ${sosFlash ? 'text-red-300' : 'text-slate-400'}`}>
                              GPS Coordinates
                            </span>
                            <span className={`font-bold ${sosFlash ? 'text-red-100' : 'text-slate-800'}`}>
                              {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}
                            </span>
                          </div>

                          {/* Nearest Stop */}
                          <div className={`p-2.5 rounded-lg text-xs ${
                            sosFlash ? 'bg-red-950/40 border border-red-800/40' : 'bg-slate-50 border border-slate-200'
                          }`}>
                            <span className={`block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${sosFlash ? 'text-red-300' : 'text-slate-400'}`}>
                              <MapPin size={10} />
                              Nearest Stop
                            </span>
                            <span className={`font-bold ${sosFlash ? 'text-red-100' : 'text-slate-800'}`}>
                              {alert.nearestStop ? `${alert.nearestStop.stopName} (${alert.nearestStop.distance})` : 'Unknown'}
                            </span>
                          </div>

                          {/* Nearest Bus */}
                          <div className={`p-2.5 rounded-lg text-xs ${
                            sosFlash ? 'bg-red-950/40 border border-red-800/40' : 'bg-slate-50 border border-slate-200'
                          }`}>
                            <span className={`block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${sosFlash ? 'text-red-300' : 'text-slate-400'}`}>
                              <Navigation size={10} />
                              Closest Bus
                            </span>
                            <span className={`font-bold ${sosFlash ? 'text-red-100' : 'text-slate-800'}`}>
                              {alert.nearestBus ? `${alert.nearestBus.busNumber} (${alert.nearestBus.distance})` : 'N/A'}
                            </span>
                            {alert.nearestBus && (
                              <span className={`block text-[10px] ${sosFlash ? 'text-red-300' : 'text-slate-400'}`}>
                                Route: {alert.nearestBus.routeName} • {alert.nearestBus.busType}
                              </span>
                            )}
                          </div>

                          {/* Elapsed Time */}
                          <div className={`p-2.5 rounded-lg text-xs font-mono ${
                            sosFlash ? 'bg-red-950/40 border border-red-800/40' : 'bg-slate-50 border border-slate-200'
                          }`}>
                            <span className={`block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${sosFlash ? 'text-red-300' : 'text-slate-400'}`}>
                              <Clock size={10} />
                              Elapsed
                            </span>
                            <span className={`font-bold ${sosFlash ? 'text-red-100' : 'text-slate-800'}`}>
                              {Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / 60000)}m ago
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Resolve Button */}
                      <button
                        onClick={() => resolveSos(alert.sosId)}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 border cursor-pointer ${
                          sosFlash
                            ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <Check size={14} />
                        Resolve
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, '_blank');
                        }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                          sosFlash
                            ? 'bg-red-950/60 hover:bg-red-900 text-red-200 border-red-800'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                        }`}
                      >
                        <MapPin size={11} />
                        View on Google Maps
                      </button>
                      {alert.nearestBus && (
                        <button
                          onClick={() => {
                            // Focus on the nearest bus
                            onRefreshBuses();
                          }}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                            sosFlash
                              ? 'bg-red-950/60 hover:bg-red-900 text-red-200 border-red-800'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                          }`}
                        >
                          <Locate size={11} />
                          Locate {alert.nearestBus.busNumber}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map display */}
          <div className="lg:col-span-8 space-y-4">
            <MapTracker
              buses={buses}
              routes={routes}
              stops={stops}
              selectedBusId={selectedBusId}
              onSelectBus={(id) => setSelectedBusId(id)}
            />
          </div>

          {/* Manual Dispatch Overrides Panel (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Settings size={16} className="text-blue-600 animate-spin-slow" />
                Live Dispatch Controls
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Select a vehicle from the map or dropdown to override route GPS coordinates, adjust delay, or broadcast notifications.</p>
            </div>

            {dispatchSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                {dispatchSuccess}
              </div>
            )}

            <form onSubmit={handleDispatchUpdate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Target Bus</label>
                <select
                  value={targetBusId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedBusId(id);
                    setTargetBusId(id);
                    const b = buses.find(x => x.busId === id);
                    if (b) {
                      setBusStatus(b.status);
                      setDelayMinutes(b.delayMinutes);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Bus Vehicle --</option>
                  {buses.map(b => (
                    <option key={b.busId} value={b.busId}>{b.busNumber} ({b.busType})</option>
                  ))}
                </select>
              </div>

              {targetBusId && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Transit Status</label>
                      <select
                        value={busStatus}
                        onChange={(e) => setBusStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="ON_ROUTE">On Route</option>
                        <option value="DELAYED">Delayed</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="TERMINATED">Terminated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Delay (Mins)</label>
                      <input
                        type="number"
                        min="0"
                        value={delayMinutes}
                        onChange={(e) => setDelayMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {busStatus === 'DELAYED' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                      <div className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Delay Alert Announcement
                      </div>
                      <input
                        type="text"
                        placeholder="Alert Title (e.g., Road Block)"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-[11px] focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        placeholder="Delay notification description details for passengers..."
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded text-[11px] focus:outline-none"
                      ></textarea>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Save size={14} />
                    Apply Dispatch Controls
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE FLEET */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Bus Form (4 cols) */}
          <form onSubmit={handleAddBus} className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus size={16} className="text-blue-600" />
              Register New Transit Bus
            </h3>

            {fleetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                {fleetSuccess}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Bus Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. BUS-404"
                value={newBusNumber}
                onChange={(e) => setNewBusNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Transit Class</label>
                <select
                  value={newBusType}
                  onChange={(e) => setNewBusType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="EXPRESS">Express</option>
                  <option value="ELECTRIC">Electric</option>
                  <option value="DOUBLE_DECKER">Double Decker</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Capacity</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Assign Driver</label>
              <select
                value={newDriverId}
                onChange={(e) => setNewDriverId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none cursor-pointer"
                required
              >
                <option value="">-- Choose Driver --</option>
                {drivers.filter(d => d.status === 'ACTIVE').map(d => (
                  <option key={d.driverId} value={d.driverId}>{d.driverName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Route Alignment</label>
              <select
                value={newRouteId}
                onChange={(e) => setNewRouteId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none cursor-pointer"
                required
              >
                <option value="">-- Choose Route --</option>
                {routes.map(r => (
                  <option key={r.routeId} value={r.routeId}>{r.source} ⇌ {r.destination}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 transition-all"
            >
              <Plus size={14} />
              Register Transit Fleet
            </button>
          </form>

          {/* Active Fleet List (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Transit Fleet Database</h4>
              <span className="text-[10px] font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">Total: {buses.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Bus #</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Cap</th>
                    <th className="py-3 px-4">Route Assignment</th>
                    <th className="py-3 px-4">Active Driver</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {buses.map(bus => {
                    const r = routes.find(x => x.routeId === bus.routeId);
                    return (
                      <tr key={bus.busId} className="hover:bg-slate-50/55 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{bus.busNumber}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px]">
                            {bus.busType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">{bus.capacity}</td>
                        <td className="py-3.5 px-4 truncate max-w-[250px]">
                          {r ? `${r.source} ⇌ ${r.destination}` : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">{bus.driverName}</td>
                        <td className="py-3.5 px-4 text-center">
                          {bus.status === 'DELAYED' ? (
                            <span className="inline-block text-[10px] bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-full font-bold">
                              DELAYED
                            </span>
                          ) : bus.status === 'ON_ROUTE' ? (
                            <span className="inline-block text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                              ON TIME
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              {bus.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE DRIVERS */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Driver Profile Form (4 cols) */}
          <form onSubmit={handleAddDriver} className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck size={16} className="text-blue-600" />
              Register Driver Profile
            </h3>

            {driverSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                {driverSuccess}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Driver Name</label>
              <input
                type="text"
                placeholder="e.g. సురేష్ కుమార్"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +15550099"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Commercial License Number</label>
              <input
                type="text"
                placeholder="e.g. DL-98319"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 transition-all"
            >
              <Plus size={14} />
              Register Profile
            </button>
          </form>

          {/* Driver Roster List (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Commercial Driver Roster</h4>
              <span className="text-[10px] font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">Total: {drivers.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Driver ID</th>
                    <th className="py-3 px-4">Driver Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">License #</th>
                    <th className="py-3 px-4 text-center">Roster Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {drivers.map(driver => (
                    <tr key={driver.driverId} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{driver.driverId}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{driver.driverName}</td>
                      <td className="py-3.5 px-4 font-mono">{driver.phone}</td>
                      <td className="py-3.5 px-4 font-mono font-bold uppercase">{driver.licenseNumber}</td>
                      <td className="py-3.5 px-4 text-center">
                        {driver.status === 'ON_TRIP' ? (
                          <span className="inline-block text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-2.5 py-0.5 rounded-full font-bold">
                            ON TRIP
                          </span>
                        ) : driver.status === 'ACTIVE' ? (
                          <span className="inline-block text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold">
                            READY (ACTIVE)
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                            INACTIVE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
