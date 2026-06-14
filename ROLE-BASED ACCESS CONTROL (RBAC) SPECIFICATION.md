# **ROLE-BASED ACCESS CONTROL (RBAC) SPECIFICATION**

# **HospitalityHub**

## **Version 2.0**

---

# **1\. Purpose**

The Role-Based Access Control (RBAC) framework defines how users access HospitalityHub resources and operations.

The RBAC system shall:

* Enforce tenant isolation  
* Restrict unauthorized actions  
* Support modular business types  
* Support future expansion  
* Enable permission-based authorization  
* Support branch-level restrictions  
* Support auditability

The platform shall use a **Permission-Based RBAC Model** rather than hardcoded role checks.

---

# **2\. RBAC Architecture**

Authorization flow:

User  
 ↓  
Assigned Role(s)  
 ↓  
Assigned Permission(s)  
 ↓  
Authorized Resource

Example:

Waiter  
  ↓  
order.create  
order.view  
table.view  
table.update\_status

The application must authorize by permission, not by role name.

---

# **3\. Role Categories**

The system shall support three role categories.

---

## **Platform Roles**

Managed by Super Admin.

SUPER\_ADMIN  
---

## **Tenant Roles**

Managed by Hotel Owner.

HOTEL\_OWNER  
HOTEL\_MANAGER  
RECEPTIONIST

RESTAURANT\_MANAGER  
WAITER  
CHEF

CASHIER  
DELIVERY\_DRIVER  
---

## **Customer Roles**

External users.

CUSTOMER  
---

# **4\. Module-Aware Access Control**

A tenant may subscribe to:

HOTEL  
RESTAURANT  
HOTEL\_RESTAURANT

Roles and permissions shall only be available when the related module is active.

---

## **Example**

Hotel Only Tenant

Visible Roles:

HOTEL\_OWNER  
HOTEL\_MANAGER  
RECEPTIONIST

Hidden Roles:

RESTAURANT\_MANAGER  
WAITER  
CHEF  
DELIVERY\_DRIVER  
---

Restaurant Only Tenant

Visible Roles:

HOTEL\_OWNER  
RESTAURANT\_MANAGER  
WAITER  
CHEF  
CASHIER  
DELIVERY\_DRIVER

Hidden Roles:

HOTEL\_MANAGER  
RECEPTIONIST  
---

Hotel \+ Restaurant Tenant

All roles available.

---

# **5\. Platform Role Permissions**

## **SUPER\_ADMIN**

Highest authority in the platform.

---

### **Tenant Management**

tenant.create  
tenant.view  
tenant.update  
tenant.approve  
tenant.reject  
tenant.suspend  
tenant.activate  
---

### **Subscription Management**

subscription.create  
subscription.update  
subscription.delete  
subscription.extend  
subscription.grant\_trial  
subscription.suspend  
---

### **Module Management**

module.enable  
module.disable  
module.assign  
---

### **Plan Management**

plan.create  
plan.update  
plan.delete  
plan.view  
---

### **Platform Settings**

platform.settings.view  
platform.settings.update  
---

### **Platform Analytics**

platform.analytics.view  
---

# **6\. Tenant Role Permissions**

---

# **HOTEL\_OWNER**

Highest authority inside a tenant.

Can manage all tenant resources enabled by subscription.

---

### **Organization Management**

hotel.view  
hotel.update

branch.create  
branch.view  
branch.update  
branch.delete  
---

### **Staff Management**

employee.create  
employee.view  
employee.update  
employee.activate  
employee.deactivate  
---

### **Role Management**

role.create  
role.view  
role.update  
role.assign  
---

### **Reports**

report.view  
analytics.view  
---

### **Billing Visibility**

billing.view  
subscription.view  
---

# **HOTEL\_MANAGER**

Manages hotel operations.

---

### **Hotel Operations**

hotel.view  
branch.view  
---

### **Room Management**

room.create  
room.view  
room.update  
room.delete  
---

### **Reservation Management**

reservation.create  
reservation.view  
reservation.update  
reservation.confirm  
reservation.cancel  
---

### **Guest Management**

guest.create  
guest.view  
guest.update  
---

### **Operational Reports**

report.view  
---

# **RECEPTIONIST**

Front desk operations.

---

### **Guest Services**

guest.create  
guest.view  
guest.update  
---

### **Reservations**

reservation.create  
reservation.view  
reservation.update  
reservation.confirm  
reservation.cancel  
---

### **Check-In**

guest.checkin  
---

### **Check-Out**

guest.checkout  
---

### **Room Assignment**

room.assign  
room.transfer  
---

# **RESTAURANT\_MANAGER**

Manages restaurant operations.

---

### **Category Management**

category.create  
category.view  
category.update  
category.delete  
---

### **Menu Management**

menu.create  
menu.view  
menu.update  
menu.delete  
---

### **Table Management**

table.create  
table.view  
table.update  
table.delete  
---

### **QR Management**

qr.create  
qr.view  
qr.regenerate  
---

### **Order Supervision**

order.view  
order.update  
order.cancel  
---

### **Kitchen Monitoring**

kitchen.view  
---

### **Restaurant Reports**

restaurant.report.view  
---

# **WAITER**

Handles customer service.

---

### **Tables**

table.view  
table.update\_status  
---

### **Orders**

order.create  
order.view  
order.update  
---

### **Service Requests**

service.request.view  
service.request.resolve  
---

### **Reservations**

reservation.view  
---

# **CHEF**

Kitchen operations.

---

### **Kitchen Queue**

kitchen.view  
---

### **Order Processing**

order.accept  
order.prepare  
order.ready  
---

### **Assigned Orders**

assigned.order.view  
---

# **CASHIER**

Billing coordination.

---

### **Bills**

bill.create  
bill.view  
bill.update  
---

### **Payments**

payment.view  
payment.record  
---

### **Transaction Lookup**

transaction.view  
---

### **Daily Summaries**

finance.daily.view  
---

## **Important Restriction**

Cashier does NOT directly manage POS.

POS transactions are executed through Dexel integration.

---

# **DELIVERY\_DRIVER**

Delivery fulfillment.

---

### **Deliveries**

delivery.view\_assigned  
delivery.accept  
delivery.pickup  
delivery.complete  
---

### **Status Updates**

delivery.status.update  
---

# **7\. Customer Permissions**

Customers use session-based access.

---

### **Reservations**

reservation.create  
reservation.view\_own  
reservation.cancel\_own  
---

### **Orders**

order.create  
order.view\_own  
order.track\_own  
---

### **Feedback**

feedback.create  
---

### **Profile**

profile.view\_own  
profile.update\_own  
---

# **8\. Branch-Level Security**

A tenant may operate multiple branches.

The system shall support branch restrictions.

---

## **Example**

Restaurant Manager  
Assigned to Branch A

Can access:

Branch A Data

Cannot access:

Branch B Data

unless explicitly authorized.

---

# **9\. Permission Groups**

To simplify administration, permissions shall be grouped.

---

### **SaaS Group**

tenant.\*  
subscription.\*  
plan.\*  
module.\*  
---

### **Hotel Group**

hotel.\*  
room.\*  
guest.\*  
reservation.\*  
---

### **Restaurant Group**

menu.\*  
category.\*  
table.\*  
qr.\*  
order.\*  
kitchen.\*  
---

### **Delivery Group**

delivery.\*  
---

### **Reporting Group**

report.\*  
analytics.\*  
---

# **10\. Dexel Integration Permissions**

Special permissions for integration operations.

---

### **Product Sync**

product.sync  
product.view  
---

### **Inventory Validation**

inventory.check  
---

### **POS Transaction Requests**

pos.transaction.create  
---

### **Sales Synchronization**

sales.sync.view  
---

### **Recommended Access**

Only:

SUPER\_ADMIN  
HOTEL\_OWNER  
CASHIER

should receive Dexel-related permissions.

---

# **11\. Audit & Compliance**

The system shall audit:

Login  
Logout  
Create  
Update  
Delete  
Approve  
Reject  
Activate  
Deactivate  
Payment Actions  
Permission Changes  
Role Assignments

Audit records shall include:

User  
Role  
Tenant  
Branch  
Action  
Resource  
Timestamp  
IP Address  
---

# **12\. Future Expansion**

The RBAC model shall support future roles without redesign.

Examples:

Inventory Manager  
Procurement Officer  
Housekeeping Supervisor  
Maintenance Officer  
HR Manager  
Marketing Manager  
---

# **Approved RBAC Roles (MVP)**

SUPER\_ADMIN

HOTEL\_OWNER

HOTEL\_MANAGER  
RECEPTIONIST

RESTAURANT\_MANAGER  
WAITER  
CHEF

CASHIER  
DELIVERY\_DRIVER

CUSTOMER  
