/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bus, Route, Stop } from '../types';
import { ZoomIn, ZoomOut, Maximize2, Navigation, Info, ShieldAlert } from 'lucide-react';

interface MapTrackerProps {
  buses: Bus[];
  routes: Route[];
  stops: Stop[];
  selectedBusId?: string | null;
  onSelectBus?: (busId: string | null) => void;
}

export default function MapTracker({
  buses,
  routes,
  stops,
  selectedBusId,
  onSelectBus
}: MapTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1.1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredBus, setHoveredBus] = useState<Bus | null>(null);

  // Auto-pan to selected bus when selectedBusId changes
  useEffect(() => {
    if (selectedBusId) {
      const bus = buses.find(b => b.busId === selectedBusId);
      if (bus) {
        // Center on bus coordinates
        const { x, y } = project(bus.currentLat, bus.currentLng, 800, 500);
        setOffset({ x: 400 - x * zoom, y: 250 - y * zoom });
      }
    }
  }, [selectedBusId]);

  // Coordinate Projection Helper (maps lat/lng into local SVG coordinates)
  // Our seed lat is centered around 40.7128 and lng around -74.0060.
  const minLat = 40.6800;
  const maxLat = 40.7700;
  const minLng = -74.0500;
  const maxLng = -73.9600;

  function project(lat: number, lng: number, width: number, height: number) {
    // Normalizing coordinates and scaling with 10% padding
    const padding = 0.1;
    const x = padding * width + ((lng - minLng) / (maxLng - minLng)) * width * (1 - 2 * padding);
    // Invert Y because SVG y=0 is top but latitude increases going north
    const y = padding * height + (1 - (lat - minLat) / (maxLat - minLat)) * height * (1 - 2 * padding);
    return { x, y };
  }

  // Handle Drag / Pan of Map
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetMap = () => {
    setZoom(1.1);
    setOffset({ x: 0, y: 0 });
    if (onSelectBus) onSelectBus(null);
  };

  // Route colors
  const routeColors: Record<string, string> = {
    r1: '#3b82f6', // blue
    r2: '#ef4444', // red
    r3: '#10b981'  // emerald
  };

  const activeBus = buses.find(b => b.busId === selectedBusId);

  return (
    <div className="relative w-full h-[520px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* HUD Top Control Panel */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-300 font-mono shadow-md flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          GPS Live Tracking Active
        </div>
      </div>

      {/* Map Control Buttons */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
          className="p-2 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 shadow-md transition-all active:scale-95"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.6))}
          className="p-2 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 shadow-md transition-all active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={resetMap}
          className="p-2 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 shadow-md transition-all active:scale-95"
          title="Recenter Map"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      {/* Floating Info panel when a bus is clicked */}
      {activeBus && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 text-white shadow-2xl transition-all font-sans">
          <div className="flex justify-between items-start border-b border-slate-800 pb-2 mb-2">
            <div>
              <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-slate-300 uppercase">
                {activeBus.busType}
              </span>
              <h4 className="text-lg font-bold mt-1 text-slate-100 flex items-center gap-1.5">
                <Navigation size={16} className="text-blue-400 rotate-45 animate-pulse" />
                {activeBus.busNumber}
              </h4>
            </div>
            <button 
              onClick={() => onSelectBus && onSelectBus(null)}
              className="text-xs text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded"
            >
              Close
            </button>
          </div>

          <div className="space-y-2 text-sm font-sans">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Route:</span>
              <span className="font-medium text-slate-200">
                {routes.find(r => r.routeId === activeBus.routeId)?.source.split(' ')[0]} ⇌ {routes.find(r => r.routeId === activeBus.routeId)?.destination.split(' ')[0]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Next Stop:</span>
              <span className="font-medium text-blue-400">
                {stops.find(s => s.stopId === activeBus.nextStopId)?.stopName || 'Terminal'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Arrival ETA:</span>
              <span className="font-medium text-slate-200">~{activeBus.etaMinutes || 5} mins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Driver:</span>
              <span className="font-medium text-slate-200">{activeBus.driverName || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-400">Status:</span>
              {activeBus.status === 'DELAYED' ? (
                <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 bg-red-900/40 border border-red-800 text-red-300 rounded-full font-mono font-bold">
                  <ShieldAlert size={12} />
                  DELAYED (+{activeBus.delayMinutes}m)
                </span>
              ) : activeBus.status === 'ON_ROUTE' ? (
                <span className="text-xs px-2.5 py-0.5 bg-emerald-900/40 border border-emerald-800 text-emerald-300 rounded-full font-mono font-bold">
                  ON TIME
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-full font-mono">
                  {activeBus.status}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map SVG */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 500"
          className="w-full h-full"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {/* Cyberpunk Grid Background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 41, 59, 0.3)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="800" height="500" fill="url(#grid)" />

          {/* Render Route Paths */}
          {routes.map((route) => {
            const points = route.stops.map(stop => {
              const { x, y } = project(stop.latitude, stop.longitude, 800, 500);
              return `${x},${y}`;
            }).join(' ');

            const color = routeColors[route.routeId] || '#94a3b8';

            return (
              <g key={route.routeId}>
                {/* Glow layer */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeOpacity="0.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Main line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth="3.5"
                  strokeDasharray={route.routeId === 'r2' ? '6,6' : 'none'} // dashed for express
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Render Stops (Nodes) */}
          {stops.map((stop) => {
            const { x, y } = project(stop.latitude, stop.longitude, 800, 500);
            const isConnectedToActiveBus = activeBus && routes.find(r => r.routeId === activeBus.routeId)?.stops.some(s => s.stopId === stop.stopId);

            return (
              <g key={stop.stopId} className="group cursor-pointer">
                {/* Active pulse */}
                {isConnectedToActiveBus && (
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}
                {/* Outer ring */}
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#0f172a"
                  stroke={isConnectedToActiveBus ? '#60a5fa' : '#475569'}
                  strokeWidth="2.5"
                  className="transition-all group-hover:stroke-slate-100"
                />
                {/* Inner dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill={isConnectedToActiveBus ? '#60a5fa' : '#94a3b8'}
                />
                {/* Label (fully visible, high-contrast outline) */}
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  className="pointer-events-none select-none transition-opacity"
                  style={{
                    paintOrder: 'stroke fill',
                    stroke: '#020617',
                    strokeWidth: '3.5px',
                    strokeLinejoin: 'round'
                  }}
                >
                  {stop.stopName}
                </text>
              </g>
            );
          })}

          {/* Render Moving Buses */}
          {buses
            .filter((bus) => !selectedBusId || bus.busId === selectedBusId)
            .map((bus) => {
            const { x, y } = project(bus.currentLat, bus.currentLng, 800, 500);
            const isSelected = bus.busId === selectedBusId;
            const routeColor = routeColors[bus.routeId] || '#3b82f6';

            return (
              <g 
                key={bus.busId} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectBus) onSelectBus(bus.busId);
                }}
                onMouseEnter={() => setHoveredBus(bus)}
                onMouseLeave={() => setHoveredBus(null)}
                className="cursor-pointer group"
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="18"
                    fill="none"
                    stroke={routeColor}
                    strokeWidth="1.5"
                    className="animate-spin"
                    strokeDasharray="4,4"
                  />
                )}

                {/* Bus marker pulse background */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? '14' : '10'}
                  fill={bus.status === 'DELAYED' ? '#ef4444' : routeColor}
                  fillOpacity={isSelected ? '0.25' : '0.15'}
                  className={bus.status === 'ON_ROUTE' ? 'animate-pulse' : ''}
                />

                {/* Bus core icon circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? '9' : '7'}
                  fill={bus.status === 'DELAYED' ? '#ef4444' : routeColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="transition-all group-hover:scale-110"
                />

                {/* Direction mini pointer */}
                <polygon
                  points={`${x},${y - 14} ${x - 4},${y - 10} ${x + 4},${y - 10}`}
                  fill="#ffffff"
                  className="origin-center"
                  style={{
                    transform: `rotate(${bus.busId === 'b2' ? 90 : bus.busId === 'b3' ? 220 : 0}deg)`,
                    transformOrigin: `${x}px ${y}px`
                  }}
                />

                {/* Small indicator text above bus */}
                <text
                  x={x}
                  y={y - 18}
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  className="font-mono bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded shadow pointer-events-none"
                >
                  {bus.busNumber} {bus.delayMinutes > 0 ? `(+${bus.delayMinutes}m)` : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover bus information tooltip (at bottom right) */}
      {hoveredBus && !selectedBusId && (
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-300 shadow-md flex flex-col gap-0.5 pointer-events-none font-mono">
          <div className="font-bold text-slate-100">{hoveredBus.busNumber} ({hoveredBus.busType})</div>
          <div>Next: {stops.find(s => s.stopId === hoveredBus.nextStopId)?.stopName || 'Terminal'}</div>
          <div>ETA: ~{hoveredBus.etaMinutes} mins</div>
          <div className="text-[10px] text-blue-400 mt-1">Click to lock tracking camera</div>
        </div>
      )}
    </div>
  );
}
