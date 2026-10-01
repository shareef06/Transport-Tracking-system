# Transport Tracking System

A real-time public transport tracking and fleet management application with live bus tracking, ETA calculations, delay alerts, passenger analytics, and AI-powered route optimization. Built with React, Express, and Spring Boot.

---

## Features

### 👥 Multi-Role Dashboard
- **Passenger** — Live bus tracking on map, route schedules, SOS alerts, feedback submission, travel history
- **Operator** — Fleet management, driver assignment, schedule creation, delay broadcasting
- **Admin** — User management, route builder, GPS live tracking radar, system analytics & reports, AI route optimizer

### 🗺️ Real-Time Map Tracking
- Interactive map with live bus positions and movement simulation
- Route visualization with stop sequences
- Real-time ETA calculations for each bus
- Passenger location tracking with radar-style admin view

### 🚨 SOS Emergency Alert System
- One-tap emergency alert from passenger dashboard
- Automatic nearest bus and stop detection
- Real-time notifications to operators and dispatch
- Active alert management with resolve workflow

### 🤖 AI Route Optimization
- Powered by Google Gemini AI for intelligent route analysis
- Detects traffic bottlenecks and scheduling inefficiencies
- Generates actionable optimization recommendations
- Graceful fallback when API key is not configured

### 📊 Analytics & Reporting
- Weekly traffic bar charts and route popularity metrics
- Operator compliance and on-time performance tracking
- Exportable system reports

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React Icons |
| **Backend** | Express (Node.js/TypeScript), Spring Boot (Java) |
| **AI** | Google Gemini API (`@google/genai`) |
| **Build** | Vite, esbuild, tsx |
| **Styling** | Tailwind CSS v4 |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/discp-raj/Transport-Tracking-System.git
cd Transport-Tracking-System

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
# Gemini API Key (optional — AI features work with mock fallback without it)
GEMINI_API_KEY="your_gemini_api_key_here"

# Application URL
APP_URL="http://localhost:3000"
```

### Running the App

```bash
npm run dev
```

The server will start at **http://localhost:3000**.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Passenger** | `passenger@gmail.com` | `password123` |
| **Operator** | `operator@demo.com` | `password123` |
| **Admin** | `sysadmin@transit.com` | `sysadminSecure2026!` |
| **Blocked User** | `blocked@demo.com` | `password123` |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login with email and password |
| POST | `/api/auth/logout` | Logout |

### Passenger
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/buses` | Fetch all buses with real-time locations |
| GET | `/api/routes` | Fetch all routes with stop sequences |
| GET | `/api/stops` | Fetch all bus stops |
| GET | `/api/location/:busId` | Real-time coordinates of a bus |
| GET | `/api/schedule/:busId` | Schedule details for a bus |
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/feedback` | Fetch all feedback |
| GET | `/api/favorites/:userId` | Fetch favorite routes |
| POST | `/api/favorites/toggle` | Toggle favorite route |
| GET | `/api/notifications` | Fetch notifications |
| GET | `/api/history/:userId` | Fetch travel history |

### SOS Emergency
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sos` | Trigger SOS alert |
| GET | `/api/sos` | Fetch SOS alerts |
| PUT | `/api/sos/:id/resolve` | Resolve an SOS alert |

### Operator
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/buses` | Register a new bus |
| PUT | `/api/buses/:id` | Update bus details |
| PUT | `/api/location/update` | Override bus GPS position |
| POST | `/api/schedules` | Create a schedule |
| GET | `/api/drivers` | Fetch all drivers |
| POST | `/api/drivers` | Register a new driver |
| POST | `/api/notifications/delay` | Broadcast delay notification |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Fetch all users |
| PUT | `/api/users/:id/status` | Block/activate a user |
| DELETE | `/api/users/:id` | Delete a user |
| POST | `/api/routes` | Add a new route |
| PUT | `/api/routes/:id` | Update a route |
| GET | `/api/reports` | Analytics and reports data |
| POST | `/api/ai/optimize-routes` | Run AI route optimization |

---

## Project Structure

```
├── server.ts                        # Express server with all API endpoints
├── index.html                       # Entry HTML
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies and scripts
├── src/
│   ├── main.tsx                     # React entry point
│   ├── App.tsx                      # Main application component
│   ├── index.css                    # Global styles (Tailwind)
│   ├── types.ts                     # TypeScript type definitions
│   └── components/
│       ├── AuthPage.tsx             # Login / Registration page
│       ├── PassengerDashboard.tsx   # Passenger dashboard
│       ├── OperatorDashboard.tsx    # Operator dashboard
│       ├── AdminDashboard.tsx       # Admin dashboard
│       └── MapTracker.tsx           # Map component
└── spring-boot-backend/             # Java Spring Boot backend (optional)
    ├── pom.xml
    └── src/main/java/com/transport/system/
        ├── TransportTrackingApplication.java
        ├── controller/TransitControllers.java
        ├── entity/TransitEntities.java
        └── security/WebSecurityConfig.java
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run TypeScript type checking |

---

## License

This project is licensed under the Apache-2.0 License.
