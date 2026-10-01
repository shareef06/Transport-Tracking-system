-- ========================================================
-- Transport Tracking System - Production MySQL Schema Script
-- ========================================================

CREATE DATABASE IF NOT EXISTS transport_db;
USE transport_db;

-- Table: Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(30) DEFAULT 'PASSENGER',
    status VARCHAR(30) DEFAULT 'ACTIVE'
);

-- Table: Drivers
CREATE TABLE IF NOT EXISTS drivers (
    driver_id VARCHAR(50) PRIMARY KEY,
    driver_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE'
);

-- Table: Routes
CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(50) PRIMARY KEY,
    source VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    distance VARCHAR(30) NOT NULL
);

-- Table: Stops
CREATE TABLE IF NOT EXISTS stops (
    stop_id VARCHAR(50) PRIMARY KEY,
    stop_name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL
);

-- Join Table for Route - Stops Sequence mapping
CREATE TABLE IF NOT EXISTS route_stops (
    route_id VARCHAR(50),
    stop_id VARCHAR(50),
    stop_order INT NOT NULL,
    PRIMARY KEY (route_id, stop_id),
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(stop_id) ON DELETE CASCADE
);

-- Table: Buses
CREATE TABLE IF NOT EXISTS buses (
    bus_id VARCHAR(50) PRIMARY KEY,
    bus_number VARCHAR(50) UNIQUE NOT NULL,
    bus_type VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    operator_id VARCHAR(50),
    driver_id VARCHAR(50),
    route_id VARCHAR(50),
    status VARCHAR(30) DEFAULT 'ON_ROUTE',
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    delay_minutes INT DEFAULT 0,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL,
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE SET NULL
);

-- Table: Schedules
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id VARCHAR(50) PRIMARY KEY,
    bus_id VARCHAR(50),
    route_id VARCHAR(50),
    departure_time VARCHAR(10) NOT NULL,
    arrival_time VARCHAR(10) NOT NULL,
    frequency VARCHAR(50),
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE
);

-- Table: Locations (History logs)
CREATE TABLE IF NOT EXISTS locations (
    location_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id VARCHAR(50),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE
);

-- Table: Feedback
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    message TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: Notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'announcement',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bus_id VARCHAR(50),
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE SET NULL
);


-- ========================================================
-- PRODUCTION SEED INSERTS
-- ========================================================

-- Users (BCrypt Encrypted value for 'password123')
INSERT INTO users (id, name, email, password, phone, role, status) VALUES
('u1', 'Passenger', 'passenger@gmail.com', '$2a$10$8.z33cZ8UX63c.6X9/3WRejT8ILej0ZHeGfM.859b8qP4z7890f9y', '+123456789', 'PASSENGER', 'ACTIVE'),
('u2', 'Demo Operator', 'operator@demo.com', '$2a$10$8.z33cZ8UX63c.6X9/3WRejT8ILej0ZHeGfM.859b8qP4z7890f9y', '+198765432', 'OPERATOR', 'ACTIVE'),
('u3', 'Demo Admin', 'admin@demo.com', '$2a$10$8.z33cZ8UX63c.6X9/3WRejT8ILej0ZHeGfM.859b8qP4z7890f9y', '+155555555', 'ADMIN', 'ACTIVE');

-- Drivers
INSERT INTO drivers (driver_id, driver_name, phone, license_number, status) VALUES
('d1', 'Suresh Kumar', '+15551010', 'DL-982312', 'ON_TRIP'),
('d2', 'Ravi Teja', '+15552020', 'DL-552319', 'ON_TRIP'),
('d3', 'Venkatesh', '+15553030', 'DL-112244', 'ACTIVE'),
('d4', 'Nageswara Rao', '+15554040', 'DL-334455', 'ACTIVE'),
('d5', 'Satyanarayana Murthy', '+15555050', 'DL-998877', 'ACTIVE'),
('d6', 'Padmavathi Devi', '+15556060', 'DL-665544', 'ACTIVE');

-- Routes
INSERT INTO routes (route_id, source, destination, distance) VALUES
('r1', 'Grand Central Terminal', 'North End Suburbs Terminal', '8.5 km'),
('r2', 'Westside Docks', 'East Bay Terminal', '12.0 km'),
('r3', 'Science Park Drive', 'Student Housing Complex', '6.2 km'),
('r4', 'Airport Express Terminal', 'Downtown Civic Center', '10.3 km'),
('r5', 'Riverside Boulevard', 'Tech Park Junction', '7.8 km');

-- Stops
INSERT INTO stops (stop_id, stop_name, latitude, longitude) VALUES
('s1', 'Grand Central Terminal', 40.71280000, -74.00600000),
('s2', 'Broadway Ave & 14th St', 40.72500000, -74.00900000),
('s3', 'Uptown Plaza', 40.73800000, -74.01200000),
('s4', 'High Street Station', 40.75000000, -74.01500000),
('s5', 'North End Suburbs Terminal', 40.76200000, -74.01800000),
('s6', 'Westside Docks', 40.71100000, -74.04000000),
('s7', 'Chelsea Square', 40.71200000, -74.02000000),
('s8', 'Financial District Plaza', 40.71000000, -73.99000000),
('s9', 'East Bay Terminal', 40.70800000, -73.97000000),
('s10', 'Science Park Drive', 40.69000000, -74.01000000),
('s11', 'Library Square Terminal', 40.70000000, -74.00800000),
('s12', 'Student Housing Complex', 40.71800000, -73.99800000),
('s13', 'Airport Express Terminal', 40.78000000, -74.03000000),
('s14', 'Riverside Park', 40.77000000, -74.02500000),
('s15', 'Downtown Civic Center', 40.75500000, -73.98500000),
('s16', 'Tech Park Junction', 40.73500000, -74.04500000);

-- Route Stops Mapping
INSERT INTO route_stops (route_id, stop_id, stop_order) VALUES
('r1', 's1', 1), ('r1', 's2', 2), ('r1', 's3', 3), ('r1', 's4', 4), ('r1', 's5', 5),
('r2', 's6', 1), ('r2', 's7', 2), ('r2', 's1', 3), ('r2', 's8', 4), ('r2', 's9', 5),
('r3', 's10', 1), ('r3', 's11', 2), ('r3', 's1', 3), ('r3', 's12', 4),
('r4', 's13', 1), ('r4', 's14', 2), ('r4', 's8', 3), ('r4', 's15', 4),
('r5', 's14', 1), ('r5', 's6', 2), ('r5', 's10', 3), ('r5', 's16', 4);

-- Buses
INSERT INTO buses (bus_id, bus_number, bus_type, capacity, operator_id, driver_id, route_id, status, current_lat, current_lng, delay_minutes) VALUES
('b1', 'BUS-101', 'NORMAL', 50, 'u2', 'd1', 'r1', 'ON_ROUTE', 40.71280000, -74.00600000, 0),
('b2', 'BUS-202X', 'EXPRESS', 40, 'u2', 'd2', 'r2', 'DELAYED', 40.71100000, -74.04000000, 12),
('b3', 'BUS-303E', 'ELECTRIC', 60, 'u2', 'd3', 'r3', 'ON_ROUTE', 40.69000000, -74.01000000, 0),
('b4', 'BUS-404A', 'DOUBLE_DECKER', 80, 'u2', 'd5', 'r4', 'ON_ROUTE', 40.78000000, -74.03000000, 0),
('b5', 'BUS-505E', 'ELECTRIC', 55, 'u2', 'd6', 'r5', 'ON_ROUTE', 40.77000000, -74.02500000, 0);

-- Schedules
INSERT INTO schedules (schedule_id, bus_id, route_id, departure_time, arrival_time, frequency) VALUES
('sch1', 'b1', 'r1', '08:00', '08:45', 'Every 15 mins'),
('sch2', 'b1', 'r1', '09:00', '09:45', 'Every 15 mins'),
('sch3', 'b2', 'r2', '08:15', '09:00', 'Every 30 mins'),
('sch4', 'b3', 'r3', '08:30', '09:10', 'Every 20 mins'),
('sch5', 'b4', 'r4', '07:00', '07:45', 'Every 20 mins'),
('sch6', 'b4', 'r4', '08:00', '08:45', 'Every 20 mins'),
('sch7', 'b5', 'r5', '07:30', '08:05', 'Every 15 mins'),
('sch8', 'b5', 'r5', '08:30', '09:05', 'Every 15 mins');

-- Feedback
INSERT INTO feedback (feedback_id, user_id, message, rating, created_at) VALUES
('f1', 'u1', 'The electric bus on Route 3 is very quiet and comfortable!', 5, NOW());

-- Notifications
INSERT INTO notifications (notification_id, title, message, type, created_at, bus_id) VALUES
('n1', 'Route 2 Rush Hour Congestion', 'Heavy vehicle backup near Chelsea Square has caused a 12-minute delay on BUS-202X.', 'delay', NOW(), 'b2');
