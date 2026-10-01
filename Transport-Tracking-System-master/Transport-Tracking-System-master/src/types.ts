/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'PASSENGER' | 'OPERATOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'BLOCKED';
  latitude?: number;
  longitude?: number;
  lastActive?: string;
}

export interface Stop {
  stopId: string;
  stopName: string;
  latitude: number;
  longitude: number;
}

export interface Route {
  routeId: string;
  source: string;
  destination: string;
  distance: string; // e.g., "12.4 km"
  stops: Stop[];
}

export interface Driver {
  driverId: string;
  driverName: string;
  phone: string;
  licenseNumber: string;
  status: 'ACTIVE' | 'ON_TRIP' | 'INACTIVE';
}

export interface Bus {
  busId: string;
  busNumber: string;
  busType: 'NORMAL' | 'EXPRESS' | 'DOUBLE_DECKER' | 'ELECTRIC';
  capacity: number;
  operatorId: string;
  driverId: string;
  driverName?: string;
  routeId: string;
  status: 'ON_ROUTE' | 'DELAYED' | 'TERMINATED' | 'MAINTENANCE';
  currentLat: number;
  currentLng: number;
  delayMinutes: number;
  nextStopId?: string;
  etaMinutes?: number;
}

export interface Schedule {
  scheduleId: string;
  busId: string;
  busNumber: string;
  routeId: string;
  routeTitle: string;
  departureTime: string; // "08:00"
  arrivalTime: string; // "09:15"
  frequency: string; // "Every 15 mins"
}

export interface BusLocation {
  locationId: string;
  busId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number; // in km/h
}

export interface Feedback {
  feedbackId: string;
  userId: string;
  userName: string;
  message: string;
  rating: number; // 1-5
  createdAt: string;
}

export interface Notification {
  notificationId: string;
  title: string;
  message: string;
  type: 'delay' | 'emergency' | 'announcement';
  createdAt: string;
  busId?: string;
}

export interface TravelHistory {
  historyId: string;
  userId: string;
  busNumber: string;
  routeTitle: string;
  date: string;
  fare: string;
}

export interface SOSAlert {
  sosId: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  message: string;
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
  nearestBus?: {
    busId: string;
    busNumber: string;
    busType: string;
    distance: string; // e.g., "0.3 km"
    routeName: string;
  };
  nearestStop?: {
    stopId: string;
    stopName: string;
    distance: string;
  };
}
