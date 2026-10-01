package com.transport.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    private String phone;
    
    @Column(nullable = false)
    private String role; // PASSENGER, OPERATOR, ADMIN
    
    @Column(nullable = false)
    private String status; // ACTIVE, BLOCKED
}

@Entity
@Table(name = "drivers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Driver {
    @Id
    @Column(name = "driver_id")
    private String driverId;
    
    @Column(name = "driver_name", nullable = false)
    private String driverName;
    
    private String phone;
    
    @Column(name = "license_number", nullable = false, unique = true)
    private String licenseNumber;
    
    @Column(nullable = false)
    private String status; // ACTIVE, ON_TRIP, INACTIVE
}

@Entity
@Table(name = "stops")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Stop {
    @Id
    @Column(name = "stop_id")
    private String stopId;
    
    @Column(name = "stop_name", nullable = false)
    private String stopName;
    
    @Column(nullable = false)
    private Double latitude;
    
    @Column(nullable = false)
    private Double longitude;
}

@Entity
@Table(name = "routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Route {
    @Id
    @Column(name = "route_id")
    private String routeId;
    
    @Column(nullable = false)
    private String source;
    
    @Column(nullable = false)
    private String destination;
    
    @Column(nullable = false)
    private String distance;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "route_stops",
        joinColumns = @JoinColumn(name = "route_id"),
        inverseJoinColumns = @JoinColumn(name = "stop_id")
    )
    @OrderColumn(name = "stop_order")
    private List<Stop> stops = new ArrayList<>();
}

@Entity
@Table(name = "buses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bus {
    @Id
    @Column(name = "bus_id")
    private String busId;
    
    @Column(name = "bus_number", nullable = false, unique = true)
    private String busNumber;
    
    @Column(name = "bus_type", nullable = false)
    private String busType; // NORMAL, EXPRESS, DOUBLE_DECKER, ELECTRIC
    
    @Column(nullable = false)
    private Integer capacity;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "operator_id")
    private User operator;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id")
    private Driver driver;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "route_id")
    private Route route;
    
    @Column(nullable = false)
    private String status; // ON_ROUTE, DELAYED, TERMINATED, MAINTENANCE
    
    @Column(name = "current_lat")
    private Double currentLat;
    
    @Column(name = "current_lng")
    private Double currentLng;
    
    @Column(name = "delay_minutes")
    private Integer delayMinutes = 0;
}

@Entity
@Table(name = "schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Schedule {
    @Id
    @Column(name = "schedule_id")
    private String scheduleId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id")
    private Bus bus;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;
    
    @Column(name = "departure_time", nullable = false)
    private String departureTime;
    
    @Column(name = "arrival_time", nullable = false)
    private String arrivalTime;
    
    private String frequency;
}
