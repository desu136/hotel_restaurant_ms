# **SOFTWARE REQUIREMENTS SPECIFICATION (SRS)**

# **HospitalityHub**

## **Multi-Tenant SaaS Hospitality Operations Platform Integrated with Dexel Ecosystem**

### **Version 2.0 (MVP)**

---

# **1\. Introduction**

## **1.1 Purpose**

HospitalityHub is a cloud-based multi-tenant Software-as-a-Service (SaaS) platform designed to digitize hospitality operations for hotels, restaurants, resorts, lodges, cafés, and mixed hospitality businesses.

The platform provides operational management for hotel services, restaurant services, reservations, QR ordering, customer experience, kitchen workflows, delivery operations, and staff management while integrating with the Dexel ecosystem for inventory, product catalog, sales processing, and POS functionality.

---

## **1.2 Business Vision**

HospitalityHub shall become a unified hospitality operations platform that enables hospitality businesses to manage customer-facing and operational activities from a single system while leveraging existing Dexel products for inventory and sales management.

The platform must support:

* Hotel-only businesses  
* Restaurant-only businesses  
* Hotel & Restaurant businesses  
* Single-branch businesses  
* Multi-branch businesses

---

## **1.3 Scope**

The MVP includes:

### **SaaS Management**

* Tenant Registration  
* Tenant Approval  
* Subscription Management  
* Plan Management  
* Module Management

### **Hotel Operations**

* Hotel Profiles  
* Branch Management  
* Room Management  
* Reservations  
* Guest Management

### **Restaurant Operations**

* Restaurant Management  
* Menu Management  
* Table Management  
* QR Services

### **Order Management**

* Dine-In  
* Room Service  
* Takeaway  
* Delivery

### **Kitchen Operations**

* Kitchen Display System (KDS)  
* Order Preparation Workflow

### **Customer Experience**

* QR Ordering  
* Web Ordering  
* Mini-App Ready Integration  
* Reservation Services  
* Feedback Services

### **Dexel Integration**

* Product Catalog Synchronization  
* Inventory Validation  
* POS Integration  
* Sales Synchronization

### **Reporting**

* Hospitality Analytics  
* Operational Reports

---

# **2\. Product Overview**

## **2.1 System Type**

HospitalityHub is a modular multi-tenant SaaS platform.w q

Each tenant operates independently while sharing the same infrastructure.

Platform  
│  
├── Tenant A  
├── Tenant B  
├── Tenant C  
└── Tenant N

Tenant data shall remain fully isolated.

---

## **2.2 Modular Business Model**

The platform shall support different business models.

### **Hotel Only**

Example:

Hotels  
Lodges  
Resorts  
Guest Houses

Enabled Modules:

Hotel  
Rooms  
Reservations  
Reception  
---

### **Restaurant Only**

Example:

Restaurant  
Café  
Bar  
Coffee Shop

Enabled Modules:

Restaurant  
Menu  
Kitchen  
QR Ordering  
Delivery  
Takeaway  
---

### **Hotel \+ Restaurant**

Example:

Full-Service Hotels  
Resorts  
Hospitality Chains

Enabled Modules:

Hotel Modules  
\+  
Restaurant Modules  
---

# **3\. Stakeholders**

## **Platform Stakeholders**

* Platform Owner  
* System Administrators  
* Support Team

---

## **Tenant Stakeholders**

* Hotel Owners  
* Restaurant Owners  
* Managers  
* Staff

---

## **Customer Stakeholders**

* Hotel Guests  
* Restaurant Customers  
* Delivery Customers

---

# **4\. User Roles**

## **Platform Roles**

### **Super Admin**

Manages the SaaS platform.

---

## **Tenant Roles**

### **Hotel Owner**

Highest authority within a tenant.

### **Hotel Manager**

Hotel operations manager.

### **Receptionist**

Reservations and guest services.

### **Restaurant Manager**

Restaurant operations.

### **Waiter**

Customer service and order handling.

### **Chef**

Kitchen operations.

### **Cashier**

Billing coordination and payment processing.

### **Delivery Driver**

Delivery fulfillment.

---

## **Customer**

External service consumer.

---

# **5\. Functional Requirements**

---

# **5.1 SaaS Management Module**

## **Tenant Registration**

The platform shall allow businesses to register.

Required information:

* Business Name  
* Owner Name  
* Phone Number  
* Email Address  
* Business Address  
* License Information  
* Tax Information (Optional)  
* Business Type

---

## **Business Type Selection**

The system shall support:

HOTEL  
RESTAURANT  
HOTEL\_RESTAURANT  
---

## **Module Assignment**

Based on business type and subscription package, the system shall automatically activate modules.

Example:

Hotel Only  
→ Hotel Modules

Restaurant Only  
→ Restaurant Modules

Hotel \+ Restaurant  
→ All Modules  
---

## **Tenant Approval**

Super Admin shall be able to:

* Approve Tenants  
* Reject Tenants  
* Suspend Tenants  
* Reactivate Tenants

---

## **Subscription Management**

The platform shall support:

* Free Trial Plans  
* Monthly Plans  
* Annual Plans  
* Enterprise Plans

---

## **Subscription Policies**

Super Admin shall configure:

* Trial Duration  
* Grace Period  
* Renewal Rules  
* Suspension Rules

---

# **5.2 Hotel Management Module**

## **Hotel Profile Management**

The system shall support:

* Hotel Information  
* Branding  
* Contact Information  
* Business Information

---

## **Branch Management**

A tenant may operate:

One Branch  
Multiple Branches

The system shall support branch management.

---

# **5.3 Staff Management Module**

The system shall support:

* Employee Registration  
* Employee Activation  
* Employee Deactivation  
* Role Assignment  
* Permission Assignment

---

# **5.4 Room Management Module**

## **Room Types**

Supported room types include:

* Single  
* Double  
* Twin  
* Family  
* Suite  
* VIP

Custom room types shall be supported.

---

## **Room Management**

The system shall support:

* Create Room  
* Update Room  
* Delete Room  
* Pricing Management  
* Image Management

---

## **Room Statuses**

Available  
Reserved  
Occupied  
Maintenance  
---

# **5.5 Reservation Management Module**

## **Room Reservation**

Customers shall be able to:

* Search Rooms  
* Reserve Rooms  
* Modify Reservations  
* Cancel Reservations

---

## **Table Reservation**

Customers shall be able to reserve restaurant tables.

---

## **Reservation Status**

Pending  
Confirmed  
Cancelled  
Completed  
---

# **5.6 Restaurant Management Module**

## **Restaurant Setup**

A branch may contain:

Main Restaurant  
Coffee Shop  
Pool Bar  
Lounge  
---

## **Category Management**

The system shall support:

* Create Category  
* Update Category  
* Delete Category

---

## **Menu Management**

The system shall support:

* Create Menu Item  
* Update Menu Item  
* Delete Menu Item  
* Availability Management  
* Image Management

---

## **Table Management**

The system shall support:

* Create Table  
* Update Table  
* Delete Table  
* Capacity Management

---

# **5.7 QR Service Module**

Each table shall have a unique QR code.

The QR shall identify:

Tenant  
Branch  
Restaurant  
Table  
---

## **QR Access**

Scanning a QR code shall allow customers to:

* View Menu  
* Place Orders  
* Request Service  
* Request Bill

---

# **5.8 Customer Experience Module**

The platform shall support two customer channels.

---

## **Channel 1: Web Access**

Customers access through:

* QR Scan  
* Direct URL  
* Hotel Discovery

If required, customers provide:

Full Name  
Phone Number  
---

## **Channel 2: Mini-App Access**

Customer identity shall be provided by the parent application through SDK integration.

The platform shall be designed to support future mini-app integration without architectural redesign.

---

# **5.9 Order Management Module**

## **Supported Order Types**

DINE\_IN  
ROOM\_SERVICE  
TAKEAWAY  
DELIVERY  
---

## **Customer Ordering**

Customers shall be able to:

* Browse Menu  
* Add Items to Cart  
* Submit Orders  
* Track Orders

---

## **Order Status Workflow**

Pending  
Confirmed  
Preparing  
Ready  
Completed  
Cancelled

Additional delivery statuses:

OutForDelivery  
Delivered  
---

# **5.10 Kitchen Operations Module**

## **Kitchen Display System (KDS)**

The platform shall provide a real-time kitchen queue.

---

## **Chef Functions**

Chefs shall be able to:

* View Orders  
* Accept Orders  
* Start Preparation  
* Mark Ready

---

## **Kitchen Monitoring**

Restaurant Managers shall be able to monitor kitchen performance.

---

# **5.11 Delivery Management Module**

Delivery Drivers shall be able to:

* View Assigned Deliveries  
* Accept Deliveries  
* Mark Picked Up  
* Mark Delivered

---

# **5.12 Billing Module**

HospitalityHub shall manage operational billing workflows.

The system shall support:

* Bill Requests  
* Order Billing  
* Payment Status Tracking

---

## **Important Note**

HospitalityHub shall not implement an independent POS system.

POS operations shall be delegated to Dexel Stock.

---

# **5.13 Customer Feedback Module**

Customers shall be able to:

* Rate Services  
* Rate Food  
* Submit Feedback

---

# **5.14 Reporting & Analytics Module**

## **Hotel Reports**

The system shall provide:

* Occupancy Reports  
* Reservation Reports  
* Guest Reports

---

## **Restaurant Reports**

The system shall provide:

* Order Reports  
* Popular Menu Reports  
* Service Reports

---

## **Operational Reports**

The system shall provide:

* Waiter Performance  
* Chef Performance  
* Delivery Performance

---

# **5.15 Dexel Integration Module**

## **Purpose**

HospitalityHub shall integrate with Dexel Stock.

---

## **Product Synchronization**

The platform shall retrieve:

* Products  
* Categories  
* Pricing  
* Product Images  
* Availability

from Dexel Stock.

---

## **Inventory Validation**

Before order confirmation, the platform may verify availability through Dexel Stock.

---

## **POS Integration**

Completed billable transactions shall be sent to Dexel Stock for:

* Sales Recording  
* Invoice Generation  
* Receipt Generation  
* Tax Processing  
* Payment Recording

---

## **Sales Synchronization**

HospitalityHub shall receive transaction results from Dexel Stock.

---

# **6\. Non-Functional Requirements**

## **Security**

The system shall provide:

* JWT Authentication  
* RBAC Authorization  
* Password Encryption  
* Audit Logging  
* Tenant Isolation

---

## **Performance**

The platform shall support:

* Concurrent Users  
* Real-Time Order Updates  
* Real-Time Kitchen Updates

---

## **Scalability**

The system shall support:

* Thousands of Customers  
* Hundreds of Tenants  
* Multiple Branches Per Tenant

---

## **Availability**

Target uptime:

99.5% or Higher  
---

## **Localization**

Supported languages:

* English  
* Amharic  
* Afaan Oromo  
* Tigrinya  
* Somali

The system shall support future language additions.

---

# **7\. Integration Requirements**

The platform shall integrate with:

### **Dexel Stock**

* Product Catalog  
* Inventory  
* POS  
* Sales

### **Payment Providers**

* Chapa  
* Telebirr  
* CBE Birr  
* Bank Integrations

### **Communication Providers**

* SMS Providers  
* Email Providers

### **Future Mini-App Runtime**

* SDK Authentication  
* User Identity Exchange

# **8\. Future Enhancements**

Not included in MVP:

* Loyalty Programs  
* Coupons  
* Promotions  
* Housekeeping Management  
* Maintenance Management  
* HR Management  
* Payroll  
* Attendance Management

---

# **9\. Acceptance Criteria**

The MVP shall be accepted when:

* Multi-tenant SaaS architecture is operational  
* Tenant onboarding is functional  
* Hotel operations are functional  
* Restaurant operations are functional  
* QR services are functional  
* Reservations are functional  
* Ordering workflows are functional  
* Kitchen workflows are functional  
* Delivery workflows are functional  
* Dexel Stock integration is functional  
* Reporting is functional  
* Tenant isolation is verified  
* RBAC is enforced  
* Subscription management is operational

