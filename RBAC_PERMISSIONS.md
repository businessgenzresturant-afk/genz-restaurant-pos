# 🔐 Role-Based Access Control (RBAC) Permissions

## User Roles

### ADMIN (business.genzresturant@gmail.com)
**Full System Access** - Can do everything

### STAFF (staff@genz.com)  
**Limited Operational Access** - Daily POS operations only

---

## Permission Matrix

| Feature | ADMIN | STAFF | Notes |
|---------|-------|-------|-------|
| **Dashboard** | ✅ | ✅ | View stats, create orders |
| **Orders - Create** | ✅ | ✅ | Place new orders |
| **Orders - View** | ✅ | ✅ | View all orders |
| **Orders - Update Status** | ✅ | ✅ | Mark as served/ready |
| **Orders - Cancel Item** | ✅ | ✅ | Cancel individual items (with reason) |
| **Orders - Delete** | ✅ | ❌ | Only ADMIN can delete entire orders |
| **Bills - Generate** | ✅ | ✅ | Create bills |
| **Bills - View** | ✅ | ✅ | View all bills |
| **Bills - Update Payment** | ✅ | ✅ | Process payments |
| **Kitchen Display (KDS)** | ✅ | ✅ | View and update order status |
| **Tables - View** | ✅ | ✅ | See table layout |
| **Tables - Create** | ✅ | ❌ | Only ADMIN can create tables |
| **Tables - Update** | ✅ | ❌ | Only ADMIN can edit tables |
| **Tables - Delete** | ✅ | ❌ | Only ADMIN can delete tables |
| **Tables - Clear** | ✅ | ✅ | Staff can clear tables |
| **Menu - View** | ✅ | ✅ | See menu items |
| **Menu - Create** | ✅ | ❌ | Only ADMIN can add items |
| **Menu - Update** | ✅ | ❌ | Only ADMIN can edit items |
| **Menu - Delete** | ✅ | ❌ | Only ADMIN can delete items |
| **Reports** | ✅ | ✅ | View sales reports |
| **Settings - Restaurant** | ✅ | ❌ | Only ADMIN can change restaurant settings |
| **Settings - Staff Management** | ✅ | ❌ | Only ADMIN can manage staff |
| **Settings - Tax & Pricing** | ✅ | ❌ | Only ADMIN can set tax rates |
| **Settings - KDS Token** | ✅ | ❌ | Only ADMIN can manage KDS security |

---

## API Endpoints RBAC

### Public (No Auth Required)
- `GET /api/kds-orders?token=...` - KDS display on TV

### STAFF Access (Both ADMIN & STAFF)
- `GET /api/orders`
- `POST /api/orders` - Create order
- `GET /api/orders/[id]`
- `PATCH /api/orders/[id]` - Update status
- `PATCH /api/orders/[id]/items` - Cancel item
- `GET /api/bills`
- `POST /api/bills` - Generate bill
- `PATCH /api/bills/[id]` - Update payment
- `GET /api/tables`
- `POST /api/tables/[id]/clear` - Clear table
- `GET /api/menu`
- `GET /api/reports`
- `GET /api/kds-orders` (authenticated)

### ADMIN Only
- `POST /api/tables` - Create table
- `PATCH /api/tables/[id]` - Update table
- `DELETE /api/tables/[id]` - Delete table
- `POST /api/menu` - Create menu item
- `PATCH /api/menu/[id]` - Update menu item
- `DELETE /api/menu/[id]` - Delete menu item
- `DELETE /api/orders/[id]` - Delete order
- `GET /api/settings/*` - All settings endpoints
- `POST /api/settings/*` - All settings updates
- `GET /api/users` - Staff management
- `POST /api/users` - Create staff
- `PATCH /api/users/[id]` - Update staff
- `DELETE /api/users/[id]` - Delete staff

---

## Frontend RBAC

### Header Dropdown Menu
**ADMIN sees:**
- ✅ Manage Tables
- ✅ Manage Menu
- ✅ Restaurant Settings
- ✅ Manage Staff
- ✅ Tax & Pricing
- ✅ System Settings

**STAFF sees:**
- ❌ All management options hidden
- ✅ Only: Sign Out

### Dashboard Cards
**Both see:**
- ✅ Tables Occupied
- ✅ Kitchen Queue
- ✅ Today's Revenue
- ✅ Dine In / Takeaway / Delivery

---

## Implementation Status

✅ Auth helper has RBAC functions
✅ Database has user roles
✅ Session includes role
⏳ Need to add `checkAuth(req, 'ADMIN')` to admin endpoints
⏳ Need to hide admin UI for STAFF users

---

## Login Credentials

### Production Accounts
```
ADMIN Account:
Email: business.genzresturant@gmail.com
Password: [your existing password]
Access: FULL SYSTEM ACCESS

STAFF Account:
Email: staff@genz.com
Password: [your existing password]
Access: OPERATIONS ONLY
```

---

**Status**: Implementation in progress
**Priority**: HIGH - Security critical
