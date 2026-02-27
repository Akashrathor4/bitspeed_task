# Bitespeed Identity Reconciliation

A backend service that links customer identities across multiple purchases — even when they use different emails or phone numbers each time.

Built as part of the Bitespeed × FluxKart.com integration challenge.

---

## Live API

```
https://bitspeed-task-vzg5.onrender.com/
```

> Replace with your actual Render deployment URL after deploying.

---

## Stack

- **Runtime:** Node.js
- **Framework:** Express.js v4
- **Database:** MongoDB (Mongoose)
- **Config:** dotenv
- **Dev:** Nodemon

---

## Project Layout

```
bitespeed-identity/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection setup
│   ├── controllers/
│   │   └── identityController.js  # Core reconciliation logic
│   ├── models/
│   │   └── Contact.js             # Contact schema
│   ├── routes/
│   │   └── identityRoutes.js      # API route definitions
│   ├── app.js                     # Express app
│   └── server.js                  # Entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Local Setup

**Requirements:** Node.js >= 16.x and a MongoDB instance (local or Atlas)

```bash
# 1. Clone
git clone https://github.com/your-username/bitespeed-identity.git
cd bitespeed-identity

# 2. Install packages
npm install

# 3. Configure environment
cp .env.example .env
```

Update your `.env` file:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bitespeed
NODE_ENV=development
```

For MongoDB Atlas, use your connection string instead:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/bitespeed
```

```bash
# 4. Start dev server
npm run dev
```

Server runs at `http://localhost:3000`

---

## API

### Health Check

```
GET /
```

```json
{
  "status": "OK",
  "message": "🚀 Bitespeed Identity Reconciliation API is running!",
  "version": "1.0.0"
}
```

---

### POST /identify

Accepts an email, phone number, or both. Returns the unified contact record.

**Request**

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

> At least one field is required.

**Response**

```json
{
  "contact": {
    "primaryContatctId": "64f1a2b3c4d5e6f7a8b9c0d1",
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": ["64f1a2b3c4d5e6f7a8b9c0d2"]
  }
}
```

---

## How It Works

When a request comes in, the service checks for existing contacts matching the provided email or phone number:

- **No match found** → Creates a new primary contact
- **Exact match found** → Returns the existing contact cluster as-is
- **Partial match (new info)** → Creates a secondary contact linked to the existing primary
- **Two separate primaries linked together** → The older one stays primary; the newer one is demoted to secondary

### Contact Schema

```js
{
  phoneNumber,      // String | null
  email,            // String | null
  linkedId,         // Ref to primary contact | null
  linkPrecedence,   // "primary" | "secondary"
  createdAt,
  updatedAt,
  deletedAt         // null unless soft-deleted
}
```

---

## Test Scenarios

**New customer:**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "doc@hillvalley.edu", "phoneNumber": "8885550001"}'
```

**Returning customer with a new email:**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "emmett@hillvalley.edu", "phoneNumber": "8885550001"}'
```

**Linking two separate contacts:**
```bash
# Step 1 — create first contact
curl -X POST http://localhost:3000/identify \
  -d '{"email": "george@hillvalley.edu", "phoneNumber": "919191"}'

# Step 2 — create second contact
curl -X POST http://localhost:3000/identify \
  -d '{"email": "biffsucks@hillvalley.edu", "phoneNumber": "717171"}'

# Step 3 — link them together
curl -X POST http://localhost:3000/identify \
  -d '{"email": "george@hillvalley.edu", "phoneNumber": "717171"}'
```

---

## Deployment (Render.com)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect your repo and configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add environment variables in the Render dashboard:
   - `MONGODB_URI` — your Atlas connection string
   - `NODE_ENV` — `production`
5. Hit **Deploy**

---

## Production

```bash
# Run directly
npm run prod

# OR with PM2 (recommended)
npm install -g pm2
pm2 start src/server.js --name "bitespeed-identity"
pm2 startup && pm2 save
pm2 logs bitespeed-identity
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-reload on changes) |
| `npm start` | Start normally |
| `npm run prod` | Start in production mode |

---

## Notes

- Request body must be JSON (not form-data)
- Phone numbers are stored as strings
- Emails are lowercased before storage
- Soft-delete support is built in via `deletedAt`
- Indexes on `email`, `phoneNumber`, and `linkedId` for query performance
