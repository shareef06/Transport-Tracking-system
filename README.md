# Transport Tracking System

A full-stack transit management and real-time tracking application featuring role-based dashboards for administrators, operators, and passengers.

---

## Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons
* **Backend:** Spring Boot (Java), REST APIs, Spring Security
* **Database / Config:** SQL schema, application properties, environment configurations

---

## Project Structure

```text
Transport-Tracking-System/
├── src/                          # React Frontend Source Code
│   ├── components/               # Role-based Dashboards & Map Tracking
│   │   ├── AdminDashboard.tsx    # Administrator management panel
│   │   ├── OperatorDashboard.tsx # Transit operator interface
│   │   ├── PassengerDashboard.tsx# Passenger view & tracking
│   │   ├── MapTracker.tsx        # Real-time map component
│   │   └── AuthPage.tsx          # Login & Authentication
│   ├── App.tsx                   # Main application router/entry
│   ├── main.tsx                  # React DOM entry point
│   ├── index.css                 # Tailwind CSS styles
│   └── types.ts                  # TypeScript interface definitions
├── spring-boot-backend/          # Spring Boot Backend Service
│   ├── src/main/java/com/transport/system/
│   │   ├── controller/           # REST Controllers
│   │   ├── entity/               # Database Entities
│   │   ├── security/             # Web Security Configuration
│   │   └── TransportTrackingApplication.java
│   ├── src/main/resources/       # application.properties
│   ├── schema.sql                # Database schema
│   └── pom.xml                   # Maven dependencies
├── package.json                  # Frontend dependencies
├── vite.config.ts                # Vite configuration
└── tsconfig.json                 # TypeScript configuration
