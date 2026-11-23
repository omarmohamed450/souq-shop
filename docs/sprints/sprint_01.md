# Sprint 01 Requirements Specification

## 1. Core Architecture
- **Backend:** Node.js + Express (MVC Pattern)
- **Frontend:** Angular
- **Database:** MongoDB
- **Localization:** English Single Language Support

---

## 2. Public User Scope
### Features & Interfaces
1. **Home Page:**
   - Display product categories and available items.
2. **Item Details Page:**
   - Display item name, description, and price.
   - **Restriction:** Item quantity MUST NOT be visible to public users.
3. **Favorites Page:**
   - Add/Remove items to/from Favorites.
   - **Storage:** Persisted locally using browser `LocalStorage`.
4. **Cart Page:**
   - Add/Remove items and adjust quantities in Cart.
   - **Storage:** Persisted locally using browser `LocalStorage`.
5. **Buy / Checkout Page:**
   - Collect user details and order notes.
   - Submit order with initial status: `opened`.
   - Clear UI note: Order confirmation and delivery are handled via phone calls.

---

## 3. Manager Scope
### Authentication & Security
- Secure Manager Login (JWT / Session-based).
- Only one Manager user role required for Sprint 01.

### Manager Dashboard Views
1. **Categories Management:** CRUD operations.
2. **Items Management:**
   - CRUD operations (Name, Description, Price, Quantity).
   - Item quantity tracking is visible ONLY in the Manager Dashboard.
3. **Orders Management:**
   - View order details, user information, and order notes.
   - Toggle order status between `opened` and `closed`.

---

## 4. Business Logic & Constraints Summary
- Public users can browse, use Favorites/Cart via `LocalStorage`, and submit orders.
- Item `quantity` is strictly hidden from public views and public APIs.
- Order placement does not require online payment integration in Sprint 01; orders are fulfilled via phone call.
- Manager has exclusive access to Inventory Quantity and Order Status management.