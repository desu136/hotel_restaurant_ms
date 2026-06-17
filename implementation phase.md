# IMPLEMENTATION_ROADMAP.md

# Release 0 — Foundation

## Core Infrastructure

### Authentication

* Login
* Logout
* JWT
* Refresh Tokens
* Password Reset

### Authorization

* RBAC
* Roles
* Permissions
* Permission Groups

### Multi-Tenancy

* Tenant Isolation
* Branch Isolation
* Tenant Middleware
* Branch Middleware

### Audit System

* Audit Logs
* Activity Logs
* Login Logs

### Shared UI System

* Dashboard Layout
* Sidebar
* Top Navigation
* Tables
* Forms
* Modals
* Notifications

### Dexel Foundation

* Dexel API Client
* Sync Framework
* Webhook Framework

### Mini-App Foundation

* Customer Identity
* External Identity Support
* API-First Design

### Deliverables

* Authentication
* RBAC
* Multi-Tenancy
* Audit Logging

---

# Release 1 — Super Admin Portal

## Account

### SUPER_ADMIN

### Dashboard

* Tenant Statistics
* Revenue Statistics
* Subscription Statistics

### Tenant Management

* Approve Tenant
* Reject Tenant
* Suspend Tenant
* Activate Tenant

### Subscription Management

* Create Plan
* Update Plan
* Delete Plan
* Assign Plan
* Extend Subscription

### Module Management

* Enable Module
* Disable Module
* Assign Module

### Platform Settings

* Localization
* Notifications
* Payments

### Deliverables

* SaaS Administration Portal

---

# Release 2 — Business Owner Portal

## Accounts

### HOTEL_OWNER

### RESTAURANT_OWNER

### Dashboard

* Business Overview
* Revenue Overview
* Branch Overview

### Business Profile

* Business Information
* Branding
* Contacts

### Branch Management

* Create Branch
* Update Branch
* Disable Branch

### Employee Management

* Create Employee
* Update Employee
* Activate Employee
* Deactivate Employee

### Role Management

* Create Role
* Update Role
* Assign Role

### Permission Management

* Assign Permissions
* Revoke Permissions

### Subscription

* View Subscription
* View Modules

### Reports

* Revenue Reports
* Operational Reports

### Deliverables

* Business Management
* Employee Management
* Branch Management

---

# Release 3 — Hotel Operations Portal

## Accounts

### HOTEL_MANAGER

### RECEPTIONIST

## HOTEL_MANAGER

### Dashboard

* Occupancy Overview
* Reservation Overview
* Guest Overview

### Room Types

* Create Room Type
* Update Room Type
* Delete Room Type

### Rooms

* Create Room
* Update Room
* Delete Room
* Room Pricing
* Room Status

### Guest Profiles

* Create Guest
* Update Guest
* Guest History

### Reservations

* Create Reservation
* Update Reservation
* Confirm Reservation
* Cancel Reservation

### Reports

* Occupancy Reports
* Reservation Reports
* Guest Reports

## RECEPTIONIST

### Dashboard

* Arrivals
* Departures
* Active Guests

### Check-In

* Guest Check-In

### Check-Out

* Guest Check-Out

### Room Assignment

* Assign Room
* Transfer Room

### Guest Services

* Guest Requests
* Reservation Desk

### Deliverables

* Hotel Operations
* Front Desk Operations

---

# Release 4 — Restaurant Administration Portal

## Account

### RESTAURANT_MANAGER

### Dashboard

* Orders Today
* Revenue Today
* Active Tables

### Restaurant Setup

* Restaurants
* Sections
* Dining Areas

### Categories

* Create Category
* Update Category
* Delete Category

### Menu Management

* Sync Dexel Products
* Configure Menu Items
* Availability Management
* Images
* Descriptions

### Tables

* Create Table
* Update Table
* Capacity Management

### QR Codes

* Generate QR
* Regenerate QR
* Download QR

### Reservations

* Table Reservations

### Reports

* Restaurant Reports
* Sales Reports

### Deliverables

* Restaurant Administration
* QR Infrastructure

---

# Release 5 — Customer Experience Portal

## Account

### CUSTOMER

### Home

* Restaurant Discovery
* Hotel Discovery

### Menu

* Browse Menu
* Search Menu
* Filter Menu

### Cart

* Add Item
* Remove Item
* Update Quantity

### Checkout

* Submit Order

### Orders

* Track Orders
* Order History

### Reservations

* Room Reservation
* Table Reservation

### Feedback

* Ratings
* Reviews

### Profile

* Profile Management

### Access Channels

#### Current

* QR Access
* Web Access

#### Future

* Mini-App Access
* Mobile App Access

### Deliverables

* Customer Ordering Platform

---

# Release 6 — Waiter Portal

## Account

### WAITER

### Dashboard

* Assigned Tables
* Active Orders

### Tables

* Table Status
* Seat Assignment

### Orders

* Create Order
* Update Order
* View Order

### Service Requests

* View Requests
* Resolve Requests

### Bill Requests

* Request Bill

### Deliverables

* Waiter Operations

---

# Release 7 — Kitchen Operations Portal

## Account

### CHEF

### Dashboard

* Kitchen Queue
* Assigned Orders

### Kitchen Queue

* Accept Order
* Start Preparation
* Mark Ready

### Preparation Tracking

* Preparation Status
* Preparation Time

### Performance

* Kitchen Metrics

### Deliverables

* Kitchen Display System

---

# Release 8 — Cashier & Dexel Operations Portal

## Account

### CASHIER

### Dashboard

* Pending Bills
* Completed Bills

### Billing

* Create Bill
* Update Bill
* Close Bill

### Payments

* Record Payment
* Payment Tracking

### Transactions

* Transaction Lookup

### Dexel Integration

#### Product Sync

* Products
* Categories
* Prices
* Images

#### Inventory Validation

* Stock Validation

#### POS Integration

* Sales Submission
* Invoice Generation
* Receipt Generation

#### Sync Monitoring

* Sync Logs
* Failed Syncs
* Retry Sync

### Deliverables

* Billing System
* Dexel Integration

---

# Release 9 — Delivery Operations Portal

## Account

### DELIVERY_DRIVER

### Dashboard

* Assigned Deliveries
* Active Deliveries

### Deliveries

* Accept Delivery
* Pickup Order
* Mark Out For Delivery
* Mark Delivered

### History

* Delivery History

### Deliverables

* Delivery Operations

---

# Release 10 — Analytics & Executive Dashboards

## Accounts

### SUPER_ADMIN

### HOTEL_OWNER

### RESTAURANT_OWNER

### HOTEL_MANAGER

### RESTAURANT_MANAGER

### Dashboards

#### Hotel Analytics

* Occupancy
* Reservations
* Revenue

#### Restaurant Analytics

* Orders
* Revenue
* Menu Performance

#### Staff Analytics

* Waiter Performance
* Chef Performance
* Reception Performance
* Delivery Performance

#### SaaS Analytics

* Tenant Growth
* Revenue Growth
* Subscription Analytics

### Deliverables

* Executive Reporting
* Analytics Platform
