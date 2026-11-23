# Sprint 02 Requirements Specification

## 1. Core Architecture Updates
- **Backend:** Node.js + Express (MVC Pattern) extended with Nodemailer service integration and Stripe payment handling.
- **Frontend:** Angular (Updated with Stripe Checkout flow and Manager Email Dispatcher UI).
- **Database:** MongoDB (Added `EmailTemplates` collection for dynamic template management, and updated `Orders` schema to support payment status tracking).
- **Localization:** English Single Language Support.

---

## 2. Public User & Checkout Scope
### Features & Interfaces
1. **Stripe Online Payment Gateway Integration:**
   - Upgrade the Checkout page to process online payments securely via Stripe.
   - Redirect to Stripe Checkout Session / Payment Intent workflow from the Angular frontend.
   - Handle asynchronous payment status confirmation on the Backend using secure Webhook endpoints (`POST /api/payment/webhook`).
   - Update order status upon successful payment completion.

2. **Automated Customer Email Notifications:**
   - Automatically trigger an email receipt/confirmation upon successful order completion.
   - The Backend fetches the designated `order_confirmation` template dynamically from the `EmailTemplates` database collection.
   - Dynamic injection of placeholders (e.g., `{{customer_name}}`, `{{order_id}}`, `{{total_amount}}`) into the email body before dispatching via Nodemailer.

---

## 3. Manager Scope Additions
### Dashboard Views & Management
1. **Manual Email Dispatcher Interface:**
   - Dedicated Manager view to send custom or template-based emails directly to any registered or past customer.
   - Ability to select existing database templates or write custom subject/body content manually.

2. **Email Templates Management:**
   - Full CRUD capability for email templates (View, Create, Edit, Delete placeholders and text templates in the `EmailTemplates` collection).

3. **Enhanced Orders Management:**
   - View detailed transaction and payment statuses (e.g., `pending`, `paid`, `failed`) alongside existing order notes and user details.
   - Retain manual order state tracking (`opened`, `in-transit`, `closed`).

---

## 4. Business Logic & Constraints Summary
- Public users can complete checkout and pay online securely using Stripe.
- Automated email confirmations are dispatched instantly after successful order creation/payment.
- Item `quantity` strictly remains hidden from all public views and public API payloads.
- Manager retains exclusive control over inventory quantities, order status transitions, email template creation, and manual email dispatches.