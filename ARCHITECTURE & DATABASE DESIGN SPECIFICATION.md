# **ARCHITECTURE & DATABASE DESIGN SPECIFICATION**

# **HospitalityHub v2.0**

## **1\. System Architecture**

HospitalityHub shall follow a modular SaaS architecture.

┌─────────────────────────────┐  
│        Client Layer         │  
├─────────────────────────────┤  
│ Admin Portal (Web)          │  
│ Customer Web Portal         │  
│ Future Mini-App             │  
└──────────────┬──────────────┘  
              │  
              ▼  
┌─────────────────────────────┐  
│         API Layer           │  
├─────────────────────────────┤  
│ Authentication              │  
│ Authorization               │  
│ Validation                  │  
│ Rate Limiting               │  
└──────────────┬──────────────┘  
              │  
              ▼  
┌─────────────────────────────┐  
│      Application Layer      │  
├─────────────────────────────┤  
│ SaaS Module                 │  
│ Hotel Module                │  
│ Restaurant Module           │  
│ Reservation Module          │  
│ Ordering Module             │  
│ Kitchen Module              │  
│ Delivery Module             │  
│ Reporting Module            │  
│ Dexel Integration Module    │  
└──────────────┬──────────────┘  
              │  
     ┌────────┴─────────┐  
     ▼                  ▼  
┌──────────────┐   ┌──────────────┐  
│ PostgreSQL   │   │ Dexel APIs   │  
└──────────────┘   └──────────────┘  
---

# **2\. Multi-Tenant Strategy**

Tenant isolation is mandatory.

Every business record must belong to a tenant.

Example:

Tenant A  
├── Branches  
├── Staff  
├── Rooms  
├── Reservations

Tenant B  
├── Branches  
├── Staff  
├── Rooms  
├── Reservations

Users must never access data from another tenant.

---

# **3\. Core Database Principles**

### **Rule 1**

Every business entity must contain:

tenant\_id

except platform-level tables.

---

### **Rule 2**

Branch-aware entities must contain:

branch\_id  
---

### **Rule 3**

Use UUIDs for all primary keys.

id UUID PRIMARY KEY  
---

### **Rule 4**

Use soft deletion.

deleted\_at TIMESTAMP NULL  
---

### **Rule 5**

Track auditing.

created\_at  
updated\_at  
created\_by  
updated\_by  
---

# **4\. SaaS Module Tables**

## **Tenant**

Represents a subscribed business.

Tenant

| Field | Type |
| ----- | ----- |
| id | UUID |
| business\_name | String |
| owner\_name | String |
| phone | String |
| email | String |
| business\_type | Enum |
| status | Enum |
| created\_at | Timestamp |

---

### **Business Types**

HOTEL  
RESTAURANT  
HOTEL\_RESTAURANT  
---

## **SubscriptionPlan**

| Field | Type |
| ----- | ----- |
| id | UUID |
| name | String |
| monthly\_price | Decimal |
| annual\_price | Decimal |
| trial\_days | Integer |

---

## **TenantSubscription**

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant_id | UUID |
| plan_id | UUID |
| start_date | Date |
| end_date | Date |
| status | Enum |

> **Subscription History Note**: Old subscription records must never be overwritten. Every plan change or renewal should create a new subscription history record in this table to maintain an accurate audit trail of billing history.

---

## **TenantModule**

Controls enabled features.

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant\_id | UUID |
| module\_code | String |
| enabled | Boolean |

Example:

HOTEL  
ROOMS  
RESTAURANT  
MENU  
KITCHEN  
DELIVERY

This gives flexibility far beyond a simple business type field.

---

# **5\. User & RBAC Tables**

## **User**

User

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant\_id | UUID |
| branch\_id | UUID (nullable) |
| full\_name | String |
| email | String |
| phone | String |
| password\_hash | String |
| status | Enum |

---

## **Role**

Role

| Field | Type |
| ----- | ----- |
| id | UUID |
| code | String |
| name | String |

Examples:

SUPER\_ADMIN  
HOTEL\_OWNER  
WAITER  
CHEF  
---

## **Permission**

Permission

| Field | Type |
| ----- | ----- |
| id | UUID |
| code | String |

Example:

room.create  
room.view  
order.create  
---

## **UserRole**

Many-to-many.

UserRole

| user\_id |  
 | role\_id |

---

## UserBranch (Future Architecture)

Added for future multi-branch managers to map a single user to multiple branches.

UserBranch

| user_id |  
 | branch_id |

---

## **RolePermission**

RolePermission

| role\_id |  
 | permission\_id |

---

# **6\. Organization Structure**

## **Branch**

Branch

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant\_id | UUID |
| name | String |
| address | String |
| phone | String |

---

# **7\. Hotel Module**

## **RoomType**

RoomType

| id |  
 | tenant\_id |  
 | name |

Examples:

Single  
Double  
Suite  
VIP  
---

## **Room**

Room

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant\_id | UUID |
| branch\_id | UUID |
| room\_type\_id | UUID |
| room\_number | String |
| price\_per\_night | Decimal |
| status | Enum |

---

### **Room Status**

AVAILABLE  
RESERVED  
OCCUPIED  
MAINTENANCE  
---

# **8\. Customer Identity Model**

This is critical.

The platform must support:

Web Customers  
Mini-App Customers  
Future Mobile Customers  
---

## **Customer**

| Field | Type |
| ----- | ----- |
| id | UUID |
| full\_name | String |
| phone | String |
| email | String |
| source | Enum |

---

### **Source**

WEB  
MINI\_APP  
---

## **CustomerIdentity**

For future integrations.

| Field | Type |
| ----- | ----- |
| id | UUID |
| customer\_id | UUID |
| external\_user\_id | String |
| provider | String |

Example:

Dexel Mini App  
Future Mobile App  
Partner Apps  
---

# **9\. Reservation Module**

## **Reservation**

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant\_id | UUID |
| branch\_id | UUID |
| customer\_id | UUID |
| reservation\_type | Enum |
| status | Enum |
| reservation\_date | DateTime |

---

### **Reservation Type**

ROOM  
TABLE  
---

# **10\. Restaurant Module**

## **Restaurant**

A branch may contain multiple restaurants.

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant\_id | UUID |
| branch\_id | UUID |
| name | String |

---

## **Category**

| id |  
 | tenant\_id |  
 | restaurant\_id |  
 | name |

---

# **Important Change Due to Dexel**

Do NOT make HospitalityHub the owner of products.

Instead:

---

## **MenuItem**

MenuItem

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant\_id | UUID |
| restaurant\_id | UUID |
| dexel\_product\_id | String |
| display\_name | String |
| availability | Boolean |

The actual product originates from Dexel Stock.

---

# **11\. Table Management**

## **RestaurantTable**

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant\_id | UUID |
| restaurant\_id | UUID |
| table\_number | String |
| capacity | Integer |

---

## **QRCode**

| Field | Type |
| ----- | ----- |
| id | UUID |
| table\_id | UUID |
| token | String |
| status | Enum |

---

# **12\. Order Management**

## **Order**

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant\_id | UUID |
| branch\_id | UUID |
| customer\_id | UUID |
| table\_id | UUID nullable |
| room\_id | UUID nullable |
| waiter\_id | UUID nullable |
| order\_type | Enum |
| status | Enum |
| total\_amount | Decimal |

---

### **Order Types**

DINE\_IN  
ROOM\_SERVICE  
TAKEAWAY  
DELIVERY  
---

### **Status**

PENDING  
CONFIRMED  
PREPARING  
READY  
COMPLETED  
CANCELLED  
OUT\_FOR\_DELIVERY  
DELIVERED  
---

## **OrderItem**

| Field | Type |
| ----- | ----- |
| id | UUID |
| order\_id | UUID |
| menu\_item\_id | UUID |
| quantity | Integer |
| unit\_price | Decimal |

---

# **13\. Kitchen Module**

## **KitchenTicket**

| Field | Type |
| ----- | ----- |
| id | UUID |
| order\_id | UUID |
| chef\_id | UUID |
| status | Enum |

---

# **14\. Billing Module**

Because POS belongs to Dexel:

---

## **Bill**

| Field | Type |
| ----- | ----- |
| id | UUID |
| order\_id | UUID |
| amount | Decimal |
| payment\_status | Enum |

---

## **DexelTransaction**

Tracks integration.

| Field | Type |
| ----- | ----- |
| id | UUID |
| bill\_id | UUID |
| dexel\_transaction\_id | String |
| sync\_status | Enum |

---

# **15\. Delivery Module**

## **Delivery**

| Field | Type |
| ----- | ----- |
| id | UUID |
| order\_id | UUID |
| driver\_id | UUID |
| delivery\_address | Text |
| status | Enum |

---

# **16\. Feedback Module**

## **Feedback**

| Field | Type |
| ----- | ----- |
| id | UUID |
| customer\_id | UUID |
| order\_id | UUID |
| rating | Integer |
| comment | Text |

---

# **17\. Reporting Support Tables**

## **AuditLog**

| Field | Type |
| ----- | ----- |
| id | UUID |
| user\_id | UUID |
| tenant\_id | UUID |
| action | String |
| resource | String |
| timestamp | DateTime |

---

## **ActivityLog**

For analytics and monitoring.

---

# **18\. Integration Module**

## **DexelSyncLog**

Tracks all integration activity.

| Field | Type |
| ----- | ----- |
| id | UUID |
| tenant\_id | UUID |
| operation | String |
| request\_payload | JSON |
| response\_payload | JSON |
| status | Enum |

