# Shop API Endpoints

Base URL: `http://localhost:5000`

All API routes are under `/api`. Uploaded images are served outside the API prefix under `/uploads`.

## Authentication

Manager-only endpoints require a Bearer token:

```http
Authorization: Bearer <jwt>
```

The token is returned by `POST /api/auth/login`. The development seed creates a manager with:

- Username: `admin`
- Password: `password`

Change the password from the manager dashboard before using the project outside local development.

Seed commands:

```bash
npm run seed                  # creates the manager account
npm run seed:demo             # creates demo categories and items
npm run seed:email-templates  # creates the default order confirmation template
```

The server also ensures the default order confirmation template exists at startup.

## Response Format

Successful responses:

```json
{
  "success": true,
  "message": "Optional success message",
  "data": {}
}
```

Validation errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "customer.name",
      "message": "Customer name is required"
    }
  ]
}
```

Other errors:

```json
{
  "success": false,
  "message": "Error description"
}
```

The server may also include a `stack` property when `NODE_ENV=development`.

## Endpoint Summary

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/test` | Public | API health check |
| `POST` | `/api/auth/login` | Public | Manager login |
| `GET` | `/api/auth/me` | Manager | Current manager profile |
| `PATCH` | `/api/auth/change-password` | Manager | Change manager password |
| `GET` | `/api/categories` | Public | List categories |
| `GET` | `/api/items` | Public | List visible items that are in stock |
| `GET` | `/api/items/:id` | Public | Get one visible item |
| `POST` | `/api/orders` | Public | Place an order and create a Stripe Checkout session |
| `GET` | `/api/orders/:id/payment-status` | Public | Read public payment and approval status |
| `POST` | `/api/payment/webhook` | Stripe | Receive Stripe webhook events |
| `GET` | `/api/manager/categories` | Manager | List categories |
| `POST` | `/api/manager/categories` | Manager | Create a category |
| `PUT` | `/api/manager/categories/:id` | Manager | Update a category |
| `PATCH` | `/api/manager/categories/:id` | Manager | Partially update a category |
| `DELETE` | `/api/manager/categories/:id` | Manager | Delete a category and unlink it from items |
| `GET` | `/api/manager/items` | Manager | List all items, including hidden and out-of-stock |
| `GET` | `/api/manager/items/:id` | Manager | Get one item with inventory data |
| `POST` | `/api/manager/items` | Manager | Create an item |
| `PUT` | `/api/manager/items/:id` | Manager | Update an item |
| `PATCH` | `/api/manager/items/:id` | Manager | Partially update an item |
| `DELETE` | `/api/manager/items/:id` | Manager | Permanently delete an item |
| `GET` | `/api/manager/orders` | Manager | List all orders, newest first |
| `GET` | `/api/manager/orders/:id` | Manager | Get order details |
| `PATCH` | `/api/manager/orders/:id/status` | Manager | Update order fulfilment status |
| `POST` | `/api/manager/orders/:id/notes` | Manager | Add a dated internal note to an order |
| `POST` | `/api/manager/orders/:id/approve` | Manager | Approve a paid order and deduct stock |
| `POST` | `/api/manager/orders/:id/reject` | Manager | Reject a pending order |
| `GET` | `/api/manager/customers` | Manager | List past customers derived from orders |
| `GET` | `/api/manager/settings` | Manager | Read store, Stripe, and SMTP settings |
| `PUT` | `/api/manager/settings` | Manager | Update store, Stripe, and SMTP settings |
| `GET` | `/api/manager/email-templates` | Manager | List email templates and placeholders |
| `GET` | `/api/manager/email-templates/:id` | Manager | Get one email template |
| `POST` | `/api/manager/email-templates` | Manager | Create an email template |
| `PUT` | `/api/manager/email-templates/:id` | Manager | Update an email template |
| `DELETE` | `/api/manager/email-templates/:id` | Manager | Delete an email template |
| `POST` | `/api/manager/emails/send` | Manager | Send or preview a manual email |
| `GET` | `/uploads/items/:filename` | Public | Serve an uploaded item image |

---

## Health Check

### `GET /api/test`

```json
{
  "message": "API is working!"
}
```

---

## Authentication Endpoints

### `POST /api/auth/login`

Public.

Request:

```json
{
  "username": "admin",
  "password": "password"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "<jwt>",
    "user": {
      "_id": "665f...",
      "username": "admin",
      "role": "manager",
      "createdAt": "2026-11-01T00:00:00.000Z",
      "updatedAt": "2026-11-01T00:00:00.000Z"
    }
  }
}
```

Errors:

- `400` validation failed.
- `401` invalid username or password.

The JWT expires after `JWT_EXPIRES_IN` (default: `1d`).

### `GET /api/auth/me`

Manager only.

Response `200`:

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "665f...",
      "username": "admin",
      "role": "manager",
      "createdAt": "2026-11-01T00:00:00.000Z",
      "updatedAt": "2026-11-01T00:00:00.000Z"
    }
  }
}
```

Errors:

- `401` missing, invalid, or expired token.
- `404` user no longer exists.

### `PATCH /api/auth/change-password`

Manager only.

Request:

```json
{
  "currentPassword": "password",
  "newPassword": "new-secret"
}
```

Rules:

- `currentPassword` is required.
- `newPassword` must be at least 6 characters.
- The new password must differ from the current password.

Response `200`:

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

Errors:

- `400` current password is incorrect or the new password is invalid.
- `401` missing, invalid, or expired token.

---

## Public Categories

### `GET /api/categories`

Returns categories sorted by name.

Response `200`:

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "665f...",
        "name": "Electronics",
        "description": "Phones, audio, and accessories"
      }
    ]
  }
}
```

---

## Public Items

### `GET /api/items`

Returns only visible items with `quantity > 0`. Newest items are returned first.

Public item responses never include `quantity`. Use `isAvailable` to determine whether an item can be added to the cart.

Response `200`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "665f...",
        "name": "Wireless Headphones",
        "description": "Over-ear headphones with noise isolation.",
        "price": 1200,
        "imageUrl": "/uploads/items/1712345678901-abcdef1234567890.png",
        "categories": [
          {
            "_id": "665f...",
            "name": "Electronics"
          }
        ],
        "isAvailable": true,
        "createdAt": "2026-11-01T00:00:00.000Z",
        "updatedAt": "2026-11-01T00:00:00.000Z"
      }
    ]
  }
}
```

### `GET /api/items/:id`

Returns one public item when it is not hidden. Out-of-stock items remain accessible so the public details page can show an unavailable state.

Response `200`: same item shape as above, with `isAvailable: false` when stock is zero.

Errors:

- `400` invalid MongoDB item id.
- `404` item does not exist or is hidden.

The response never includes `quantity`.

---

## Public Orders

### `POST /api/orders`

Public checkout endpoint. Creates the order, opens a Stripe Checkout session, and returns the URL the storefront must redirect the customer to.

Request:

```json
{
  "customer": {
    "name": "Ahmed Hassan",
    "phone": "01000000000",
    "email": "ahmed@example.com",
    "address": "12 Nile Street, Cairo"
  },
  "notes": "Please call before delivery.",
  "items": [
    {
      "itemId": "665f...",
      "quantity": 2
    }
  ]
}
```

Validation:

- `customer.name` is required, max 120 characters.
- `customer.phone` is required, max 30 characters.
- `customer.email` is required, must be a valid email address, max 120 characters.
- `customer.address` is required, max 500 characters.
- `notes` is optional, max 1000 characters.
- `items` must contain at least one line.
- Each `itemId` must be a valid MongoDB id.
- Each `quantity` must be a positive integer.

Server behavior:

- Duplicate lines for the same item are merged.
- Prices and totals are read and calculated on the server; client totals are ignored.
- Hidden items and quantities above current stock are rejected.
- **Stock is not deducted at checkout.** It is deducted when the order is approved, either manually by a manager or automatically after payment when `autoApproveOrders` is enabled in settings.
- New orders start with `paymentStatus: "pending"` and `approvalStatus: "pending"`.
- Order lines store snapshots of the item name and price so order history survives item edits or deletion.
- References use a global counter in the format `#1001-YYYYMMDD`, for example `#1001-20261101`.
- The Stripe secret key is read from manager settings. If Stripe is not configured, or the Checkout session cannot be created, the newly created order is deleted and the request fails.

Response `201`:

```json
{
  "success": true,
  "message": "Order placed successfully. Continue to payment.",
  "data": {
    "order": {
      "_id": "665f...",
      "referenceNumber": "#1001-20261101",
      "customer": {
        "name": "Ahmed Hassan",
        "phone": "01000000000",
        "email": "ahmed@example.com",
        "address": "12 Nile Street, Cairo"
      },
      "notes": "Please call before delivery.",
      "items": [
        {
          "item": "665f...",
          "name": "Wireless Headphones",
          "price": 1200,
          "quantity": 2
        }
      ],
      "totalPrice": 2400,
      "status": "opened",
      "paymentStatus": "pending",
      "approvalStatus": "pending",
      "stockDeducted": false,
      "stripeSessionId": "cs_test_...",
      "createdAt": "2026-11-01T00:00:00.000Z",
      "updatedAt": "2026-11-01T00:00:00.000Z"
    },
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
}
```

The storefront redirects the browser to `checkoutUrl`.

Errors:

- `400` validation failed, item hidden, or insufficient stock.
- `404` item does not exist.
- `503` Stripe is not configured in manager settings.
- `502` Stripe did not return a checkout URL.

### `GET /api/orders/:id/payment-status`

Public status endpoint used by the success and cancel pages. It exposes only the safe payment summary, not customer or manager data.

Response `200`:

```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "665f...",
      "referenceNumber": "#1001-20261101",
      "totalPrice": 2400,
      "status": "opened",
      "paymentStatus": "paid",
      "approvalStatus": "pending",
      "stockDeducted": false,
      "paidAt": "2026-11-01T00:05:00.000Z",
      "createdAt": "2026-11-01T00:00:00.000Z",
      "customerEmail": "ahmed@example.com"
    }
  }
}
```

Errors:

- `400` invalid order id.
- `404` order not found.

---

## Stripe Payment Webhook

### `POST /api/payment/webhook`

Public endpoint called by Stripe. It is mounted **before** `express.json()` so Stripe can verify the raw request body.

Required header:

```http
stripe-signature: t=...,v1=...
```

The signing secret is read from manager settings (`stripeWebhookSecret`). Configure the Stripe Dashboard endpoint as:

```text
https://<your-public-host>/api/payment/webhook
```

Handled events:

| Event | Behavior |
| --- | --- |
| `checkout.session.completed` | If `payment_status` is `paid`, marks the order paid, optionally auto-approves it, then sends the confirmation email. Otherwise stores the session id. |
| `checkout.session.async_payment_succeeded` | Marks the order paid and runs the same approval/email flow. |
| `checkout.session.async_payment_failed` | Marks the order payment as `failed`. |
| `checkout.session.expired` | Marks the order payment as `failed` with an expiry reason. |

After a successful payment:

- `paymentStatus` becomes `paid` and `paidAt` is recorded.
- When `autoApproveOrders` is enabled, the order is approved and stock is deducted immediately. If stock deduction fails, the order stays pending and `approvalError` records the reason for manual follow-up.
- The `order_confirmation` email is sent once. `confirmationEmailSentAt` records success and `confirmationEmailError` records failures.

Response `200`:

```json
{
  "received": true
}
```

Errors:

- `400` missing signature or invalid signature.
- `503` Stripe webhook secret is not configured in manager settings.

---

## Manager Categories

All manager endpoints require `Authorization: Bearer <jwt>`.

### `GET /api/manager/categories`

Returns all categories sorted by name.

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "665f...",
        "name": "Electronics",
        "description": "Phones, audio, and accessories"
      }
    ]
  }
}
```

### `POST /api/manager/categories`

JSON body:

```json
{
  "name": "Electronics",
  "description": "Phones, audio, and accessories"
}
```

Rules:

- `name` is required, 2-80 characters, and must be unique.
- `description` is optional, max 500 characters.

Response `201`:

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "category": {
      "_id": "665f...",
      "name": "Electronics",
      "description": "Phones, audio, and accessories",
      "createdAt": "2026-11-01T00:00:00.000Z",
      "updatedAt": "2026-11-01T00:00:00.000Z"
    }
  }
}
```

Errors:

- `400` validation failed.
- `409` category name already exists.

### `PUT /api/manager/categories/:id`

### `PATCH /api/manager/categories/:id`

Both methods update a category. Fields are optional, but at least one field should be supplied.

```json
{
  "name": "Home Electronics",
  "description": "Updated description"
}
```

Rules:

- `name`, when supplied, is 2-80 characters and must be unique.
- `description`, when supplied, max 500 characters.

Response `200`: the updated category.

Errors:

- `400` invalid id or validation failed.
- `404` category not found.
- `409` category name already exists.

### `DELETE /api/manager/categories/:id`

Deletes the category and removes its reference from all items. Items are kept and remain publicly accessible as uncategorized items.

Response `200`:

```json
{
  "success": true,
  "message": "Category deleted successfully. Items were kept and unlinked."
}
```

Errors:

- `400` invalid id.
- `404` category not found.

---

## Manager Items

All manager endpoints require `Authorization: Bearer <jwt>`.

Manager item responses include `quantity` and `isHidden`. Public item responses do not.

### `GET /api/manager/items`

Returns every item, including hidden items and items with zero stock. Newest items first. Categories are populated.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "665f...",
        "name": "Wireless Headphones",
        "description": "Over-ear headphones with noise isolation.",
        "price": 1200,
        "quantity": 15,
        "imageUrl": "/uploads/items/1712345678901-abcdef1234567890.png",
        "isHidden": false,
        "categories": [
          {
            "_id": "665f...",
            "name": "Electronics"
          }
        ],
        "createdAt": "2026-11-01T00:00:00.000Z",
        "updatedAt": "2026-11-01T00:00:00.000Z"
      }
    ]
  }
}
```

### `GET /api/manager/items/:id`

Returns one item with inventory data and populated categories.

Errors:

- `400` invalid id.
- `404` item not found.

### `POST /api/manager/items`

Content type: `multipart/form-data`.

Fields:

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | 2-120 characters |
| `description` | No | Max 2000 characters |
| `price` | Yes | Non-negative number |
| `quantity` | Yes | Non-negative integer |
| `categories` | Yes | JSON array string with at least one category id, for example `["665f..."]` |
| `imageUrl` | No | String, max 2048 characters |
| `isHidden` | No | Boolean; accepts `true`, `false`, `1`, or `0` |
| `image` | No | JPG, PNG, or WEBP file, max 5 MB |

Image behavior:

- Uploading an `image` file stores it under `uploads/items/` and returns a path such as `/uploads/items/<filename>`.
- If both `image` and `imageUrl` are supplied, the uploaded file wins.
- If no image is supplied, `imageUrl` may point to an external URL.

Response `201`:

```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "item": {
      "_id": "665f...",
      "name": "Wireless Headphones",
      "description": "Over-ear headphones with noise isolation.",
      "price": 1200,
      "quantity": 15,
      "imageUrl": "/uploads/items/1712345678901-abcdef1234567890.png",
      "isHidden": false,
      "categories": ["665f..."],
      "createdAt": "2026-11-01T00:00:00.000Z",
      "updatedAt": "2026-11-01T00:00:00.000Z"
    }
  }
}
```

Notes:

- Create and update responses may contain category ids rather than populated category objects.
- Use `GET /api/manager/items` or `GET /api/manager/items/:id` to reload populated categories.

Errors:

- `400` validation failed, invalid image type, image over 5 MB, or category missing.
- `401` missing, invalid, or expired token.

### `PUT /api/manager/items/:id`

### `PATCH /api/manager/items/:id`

Both methods update an item. Content type: `multipart/form-data`. All fields are optional.

Fields:

| Field | Rules |
| --- | --- |
| `name` | 2-120 characters |
| `description` | Max 2000 characters |
| `price` | Non-negative number |
| `quantity` | Non-negative integer |
| `categories` | JSON array string with at least one category id |
| `imageUrl` | String, max 2048 characters |
| `isHidden` | Boolean; accepts `true`, `false`, `1`, or `0` |
| `image` | JPG, PNG, or WEBP file, max 5 MB |

Image behavior:

- A new upload replaces the previous image.
- A changed `imageUrl` replaces the previous image and deletes the old local upload.
- Omitting both preserves the current image.

Response `200`: the updated item in the same shape as create.

Errors:

- `400` invalid id or validation failed.
- `404` item not found.

### `DELETE /api/manager/items/:id`

Permanently deletes the item and its local uploaded image. Order history is not affected because order lines store item snapshots.

Response `200`:

```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

Errors:

- `400` invalid id.
- `404` item not found.

---

## Manager Orders

All manager endpoints require `Authorization: Bearer <jwt>`.

Orders carry two independent status tracks:

- `paymentStatus`: `pending`, `paid`, or `failed`.
- `approvalStatus`: `pending`, `approved`, or `rejected`.

`stockDeducted` records whether inventory has been reduced. Stock is deducted only on approval.

### `GET /api/manager/orders`

Returns all orders, newest first.

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "665f...",
        "referenceNumber": "#1001-20261101",
        "customer": {
          "name": "Ahmed Hassan",
          "phone": "01000000000",
          "email": "ahmed@example.com",
          "address": "12 Nile Street, Cairo"
        },
        "notes": "Please call before delivery.",
        "managerNotes": [
          {
            "_id": "665f...",
            "text": "Customer confirmed delivery for tomorrow morning.",
            "createdAt": "2026-11-01T09:30:00.000Z"
          }
        ],
        "items": [
          {
            "item": "665f...",
            "name": "Wireless Headphones",
            "price": 1200,
            "quantity": 2
          }
        ],
        "totalPrice": 2400,
        "status": "opened",
        "paymentStatus": "paid",
        "stripeSessionId": "cs_test_...",
        "stripePaymentIntentId": "pi_...",
        "paidAt": "2026-11-01T00:05:00.000Z",
        "paymentFailureReason": "",
        "approvalStatus": "pending",
        "stockDeducted": false,
        "approvalError": "",
        "confirmationEmailSentAt": "2026-11-01T00:05:02.000Z",
        "confirmationEmailError": "",
        "createdAt": "2026-11-01T00:00:00.000Z",
        "updatedAt": "2026-11-01T00:05:02.000Z"
      }
    ]
  }
}
```

### `GET /api/manager/orders/:id`

Returns one order, including customer information, customer notes, internal manager notes, item snapshots, totals, payment status, approval status, stock state, and email delivery tracking.

Errors:

- `400` invalid id.
- `404` order not found.

### `PATCH /api/manager/orders/:id/status`

Updates the fulfilment status only. Payment and approval status are not changed.

Request:

```json
{
  "status": "in-transit"
}
```

Allowed values:

- `opened`
- `in-transit`
- `closed`

Response `200`:

```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order": {
      "_id": "665f...",
      "status": "in-transit"
    }
  }
}
```

The response contains the full updated order object.

Errors:

- `400` invalid id or status.
- `404` order not found.

### `POST /api/manager/orders/:id/notes`

Adds an internal manager note to one order. The server records the date and time when each note is added. Notes are append-only and are only returned by manager order endpoints.

Request:

```json
{
  "text": "Customer confirmed delivery for tomorrow morning."
}
```

Validation:

- `text` is required, trimmed, and limited to 1000 characters.

Response `201`:

```json
{
  "success": true,
  "message": "Order note added successfully",
  "data": {
    "order": {
      "_id": "665f...",
      "managerNotes": [
        {
          "_id": "665f...",
          "text": "Customer confirmed delivery for tomorrow morning.",
          "createdAt": "2026-11-01T09:30:00.000Z"
        }
      ]
    }
  }
}
```

The response contains the full updated order object. Notes are stored in insertion order; the dashboard displays the newest note first.

Errors:

- `400` invalid id or validation failed.
- `404` order not found.

### `POST /api/manager/orders/:id/approve`

Approves a pending order and deducts its quantities from item stock.

Rules:

- The order must have `paymentStatus: "paid"`.
- The order must still be `approvalStatus: "pending"` and `stockDeducted: false`.
- Stock is deducted atomically line by line. If a later line fails, already-deducted quantities are rolled back.
- Calling approve on an already approved order is idempotent and returns the order unchanged.
- Rejected orders cannot be approved.
- If deduction fails because stock changed, `approvalStatus` stays `pending` and `approvalError` explains what needs attention.

Response `200`:

```json
{
  "success": true,
  "message": "Order approved and stock deducted successfully",
  "data": {
    "order": {
      "_id": "665f...",
      "approvalStatus": "approved",
      "stockDeducted": true,
      "approvedAt": "2026-11-01T10:00:00.000Z",
      "approvalError": ""
    }
  }
}
```

The response contains the full updated order object.

Errors:

- `400` payment is not paid, stock is insufficient, or the order is rejected/not pending.
- `404` order not found.

### `POST /api/manager/orders/:id/reject`

Rejects an order that is still pending approval.

Rules:

- The order must be `approvalStatus: "pending"` and `stockDeducted: false`.
- Rejecting an approved order is not allowed.
- Calling reject on an already rejected order is idempotent and returns the order unchanged.
- **Rejecting a paid order does not issue a Stripe refund automatically.** The manager must refund the payment manually in the Stripe Dashboard.

Response `200`:

```json
{
  "success": true,
  "message": "Order rejected successfully",
  "data": {
    "order": {
      "_id": "665f...",
      "approvalStatus": "rejected",
      "rejectedAt": "2026-11-01T10:00:00.000Z"
    }
  }
}
```

The response contains the full updated order object.

Errors:

- `400` order is already approved or is not pending approval.
- `404` order not found.

### `GET /api/manager/customers`

Returns past customers derived from orders that include a customer email. Each email appears once, using the most recent order's details.

```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "name": "Ahmed Hassan",
        "email": "ahmed@example.com",
        "phone": "01000000000",
        "orderId": "665f...",
        "referenceNumber": "#1001-20261101",
        "orderStatus": "opened",
        "paymentStatus": "paid",
        "lastOrderAt": "2026-11-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## Manager Settings

All manager endpoints require `Authorization: Bearer <jwt>`.

Stripe and SMTP credentials are **not** read from `.env` at runtime. They are stored in MongoDB and edited from the manager Settings page. Secret values are encrypted with AES-256-GCM and are never returned by the API; responses expose only `stripeSecretKeyConfigured`, `stripeWebhookSecretConfigured`, and `smtpPasswordConfigured` booleans.

### `GET /api/manager/settings`

Response `200`:

```json
{
  "success": true,
  "data": {
    "settings": {
      "autoApproveOrders": false,
      "storefrontUrl": "http://localhost:4200",
      "currency": "egp",
      "stripeSecretKeyConfigured": false,
      "stripeWebhookSecretConfigured": false,
      "smtpHost": "",
      "smtpPort": 587,
      "smtpSecure": false,
      "smtpUser": "",
      "smtpPasswordConfigured": false,
      "smtpFromName": "Souq Online Store",
      "smtpFromEmail": "",
      "updatedAt": "2026-11-01T00:00:00.000Z"
    }
  }
}
```

### `PUT /api/manager/settings`

All fields are optional. Secret fields are replaced only when a non-empty value is supplied.

```json
{
  "autoApproveOrders": true,
  "storefrontUrl": "http://localhost:4200",
  "currency": "egp",
  "stripeSecretKey": "sk_test_...",
  "stripeWebhookSecret": "whsec_...",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpSecure": false,
  "smtpUser": "store@example.com",
  "smtpPassword": "app-password",
  "smtpFromName": "Souq Online Store",
  "smtpFromEmail": "store@example.com"
}
```

To explicitly remove a stored secret, send its clear flag with `true`:

```json
{
  "clearStripeSecretKey": true,
  "clearStripeWebhookSecret": true,
  "clearSmtpPassword": true
}
```

Rules:

- `autoApproveOrders` and `smtpSecure` are booleans.
- `storefrontUrl` must be a valid URL. It is used for Stripe success and cancel redirects.
- `currency` must be a 3-letter code. The project default is `egp`.
- `smtpPort` must be between 1 and 65535.
- `smtpFromEmail` must be a valid email address.
- When SMTP is not configured, outgoing mail is written to the server log with Nodemailer's JSON transport and the API reports development delivery mode.

Response `200`: the public settings object, in the same shape as `GET /api/manager/settings`.

---

## Manager Email Templates

All manager endpoints require `Authorization: Bearer <jwt>`.

Templates are stored in MongoDB. The system template `order_confirmation` is created automatically at startup and by `npm run seed:email-templates`.

Supported placeholders:

| Placeholder | Value |
| --- | --- |
| `{{customer_name}}` | Customer name |
| `{{customer_email}}` | Customer email |
| `{{customer_phone}}` | Customer phone |
| `{{customer_address}}` | Delivery address |
| `{{order_id}}` | Order reference number, or order id if missing |
| `{{order_reference}}` | Order reference number |
| `{{order_date}}` | Order creation date |
| `{{order_status}}` | `Opened`, `In transit`, or `Closed` |
| `{{payment_status}}` | `Pending`, `Paid`, or `Failed` |
| `{{approval_status}}` | `Pending`, `Approved`, or `Rejected` |
| `{{total_amount}}` | Total with currency, for example `2400.00 EGP` |
| `{{order_items}}` | Multi-line item list |
| `{{order_notes}}` | Customer notes |

### `GET /api/manager/email-templates`

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "665f...",
        "key": "order_confirmation",
        "name": "Order confirmation",
        "description": "Sent automatically after a successful online payment.",
        "subject": "Order confirmation {{order_reference}}",
        "body": "Hello {{customer_name}},...",
        "isSystem": true,
        "createdAt": "2026-11-01T00:00:00.000Z",
        "updatedAt": "2026-11-01T00:00:00.000Z"
      }
    ],
    "placeholders": ["customer_name", "customer_email"]
  }
}
```

### `GET /api/manager/email-templates/:id`

Returns one template.

Errors:

- `400` invalid id.
- `404` email template not found.

### `POST /api/manager/email-templates`

Request:

```json
{
  "key": "delivery_update",
  "name": "Delivery update",
  "description": "Sent when an order ships.",
  "subject": "Update for {{order_reference}}",
  "body": "Hello {{customer_name}},\n\nYour order is on its way."
}
```

Rules:

- `key` is required, lowercase letters/numbers/underscores only, max 80 characters, and unique.
- `name` is required, max 120 characters.
- `subject` is required, max 200 characters.
- `body` is required, max 20000 characters.
- `description` is optional, max 500 characters.
- Custom templates are created with `isSystem: false`.

Response `201`: the created template.

Errors:

- `400` validation failed.
- `409` an email template with this key already exists.

### `PUT /api/manager/email-templates/:id`

Updates a template. The body accepts the same fields as create.

Response `200`: the updated template.

Errors:

- `400` invalid id or validation failed.
- `404` email template not found.
- `409` template key already exists.

### `DELETE /api/manager/email-templates/:id`

Deletes a template. The system template can be edited but should be kept if automatic confirmation emails are required.

Response `200`:

```json
{
  "success": true,
  "message": "Email template deleted successfully"
}
```

Errors:

- `400` invalid id.
- `404` email template not found.

---

## Manager Email Dispatcher

### `POST /api/manager/emails/send`

Sends a one-off email to any recipient, optionally rendered with a stored template and order data. This endpoint sends immediately; there is no draft or scheduling state.

Request with a template and order:

```json
{
  "to": "ahmed@example.com",
  "templateId": "665f...",
  "orderId": "665f..."
}
```

Request with custom content:

```json
{
  "to": "ahmed@example.com",
  "subject": "Your order {{order_reference}}",
  "body": "Hello {{customer_name}}, your order is being prepared.",
  "orderId": "665f..."
}
```

Rules:

- `to` is required and must be a valid email address.
- `templateId` and `orderId` are optional valid MongoDB ids.
- When `templateId` is supplied, its subject and body are used unless explicit `subject` or `body` values override them.
- Placeholders are rendered using the referenced order when `orderId` is supplied. Unmatched placeholders remain unchanged.
- When SMTP is not configured, the email is accepted in development mode and written to the server log.

Response `200`:

```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "delivery": {
      "mode": "smtp",
      "messageId": "<...>",
      "accepted": ["ahmed@example.com"],
      "rejected": []
    }
  }
}
```

In development mode, `mode` is `development` and the message is:

```json
{
  "success": true,
  "message": "Email accepted in development mode. Check the server logs.",
  "data": {
    "delivery": {
      "mode": "development",
      "messageId": "<...>",
      "accepted": [],
      "rejected": []
    }
  }
}
```

Errors:

- `400` validation failed, missing subject/body, or invalid ids.
- `404` template or order not found.

---

## Uploaded Images

### `GET /uploads/items/:filename`

Serves uploaded item images. These URLs are public and are used directly in item `imageUrl` fields.

Allowed upload types:

- `image/jpeg` (`.jpg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)

Maximum upload size: 5 MB.

---

## Quick cURL Examples

Login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

Create an order:

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Ahmed Hassan",
      "phone": "01000000000",
      "email": "ahmed@example.com",
      "address": "12 Nile Street, Cairo"
    },
    "notes": "Please call before delivery.",
    "items": [
      {
        "itemId": "REPLACE_WITH_ITEM_ID",
        "quantity": 1
      }
    ]
  }'
```

List manager orders:

```bash
curl http://localhost:5000/api/manager/orders \
  -H "Authorization: Bearer REPLACE_WITH_JWT"
```

Add a manager note to an order:

```bash
curl -X POST http://localhost:5000/api/manager/orders/REPLACE_WITH_ORDER_ID/notes \
  -H "Authorization: Bearer REPLACE_WITH_JWT" \
  -H "Content-Type: application/json" \
  -d '{"text":"Customer confirmed delivery for tomorrow morning."}'
```

Create a manager item with an uploaded image:

```bash
curl -X POST http://localhost:5000/api/manager/items \
  -H "Authorization: Bearer REPLACE_WITH_JWT" \
  -F "name=Wireless Headphones" \
  -F "description=Over-ear headphones with noise isolation." \
  -F "price=1200" \
  -F "quantity=15" \
  -F 'categories=["REPLACE_WITH_CATEGORY_ID"]' \
  -F "isHidden=false" \
  -F "image=@/path/to/headphones.png"
```

Save Stripe and SMTP settings:

```bash
curl -X PUT http://localhost:5000/api/manager/settings \
  -H "Authorization: Bearer REPLACE_WITH_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "autoApproveOrders": true,
    "storefrontUrl": "http://localhost:4200",
    "currency": "egp",
    "stripeSecretKey": "sk_test_REPLACE",
    "stripeWebhookSecret": "whsec_REPLACE",
    "smtpHost": "smtp.example.com",
    "smtpPort": 587,
    "smtpSecure": false,
    "smtpUser": "store@example.com",
    "smtpPassword": "REPLACE",
    "smtpFromName": "Souq Online Store",
    "smtpFromEmail": "store@example.com"
  }'
```

Approve a paid order:

```bash
curl -X POST http://localhost:5000/api/manager/orders/REPLACE_WITH_ORDER_ID/approve \
  -H "Authorization: Bearer REPLACE_WITH_JWT"
```

Send a manual email from a template:

```bash
curl -X POST http://localhost:5000/api/manager/emails/send \
  -H "Authorization: Bearer REPLACE_WITH_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ahmed@example.com",
    "templateId": "REPLACE_WITH_TEMPLATE_ID",
    "orderId": "REPLACE_WITH_ORDER_ID"
  }'
```

Forward Stripe test events locally with the Stripe CLI:

```bash
stripe listen --forward-to localhost:5000/api/payment/webhook
```

Use the `whsec_...` value printed by the CLI as `stripeWebhookSecret` in manager settings.
