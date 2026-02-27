# 🔗 Bitespeed Identity Reconciliation Service

A backend web service that identifies and keeps track of a customer's identity across multiple purchases using different contact details.

Built for [FluxKart.com](http://fluxkart.com) × Bitespeed integration challenge.

---

## 🌐 Live Endpoint

> After deploying, update this URL:

```
POST https://your-app.onrender.com/identify
```

---

## 🛠️ Tech Stack

| Layer      | Technology             |
|------------|------------------------|
| Language   | JavaScript (Node.js)   |
| Framework  | Express.js v4          |
| Database   | MongoDB (via Mongoose) |
| Config     | dotenv                 |
| Dev Tool   | Nodemon                |

---

## 📁 Project Structure

```
bitespeed-identity/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   └── identityController.js  # Core business logic
│   ├── models/
│   │   └── Contact.js             # Mongoose Contact schema
│   ├── routes/
│   │   └── identityRoutes.js      # Route definitions
│   ├── app.js                     # Express app setup
│   └── server.js                  # Server entry point
├── .env.example                   # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## ⚡ Getting Started (Development)

### Prerequisites

- Node.js >= 16.x
- MongoDB running locally OR a MongoDB Atlas URI

### 1. Clone the repository

```bash
git clone https://github.com/your-username/bitespeed-identity.git
cd bitespeed-identity
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bitespeed
NODE_ENV=development
```

> **MongoDB Atlas (cloud):** Replace `MONGODB_URI` with your Atlas connection string:
> `mongodb+srv://<username>:<password>@cluster.mongodb.net/bitespeed`

### 4. Run in development mode

```bash
npm run dev
```

Server starts at: `http://localhost:3000`

---

## 🚀 Production Commands

### Run in production mode

```bash
NODE_ENV=production node src/server.js
```

OR using the npm script:

```bash
npm run prod
```

### Using PM2 (recommended for production servers)

```bash
# Install PM2 globally
npm install -g pm2

# Start app
pm2 start src/server.js --name "bitespeed-identity"

# Auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 logs bitespeed-identity
pm2 status
```

---

## 🌍 Deploying to Render.com (Free Hosting)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables in Render dashboard:
   - `MONGODB_URI` = your MongoDB Atlas URI
   - `PORT` = 3000 (or leave blank — Render sets it automatically)
   - `NODE_ENV` = production
6. Deploy!

---

## 📡 API Reference

### Health Check

```http
GET /
```

**Response:**
```json
{
  "status": "OK",
  "message": "🚀 Bitespeed Identity Reconciliation API is running!",
  "version": "1.0.0"
}
```

---

### Identify Contact

```http
POST /identify
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

> At least one of `email` or `phoneNumber` is required.

**Response:**

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

## 🧠 Business Logic

### Rules

1. **New contact:** If no existing contact matches, create a new `primary` contact.
2. **Existing contact, same info:** Return the existing contact cluster — no new record created.
3. **Existing contact, new info:** If email or phone matches but the pair is new, create a `secondary` contact linked to the primary.
4. **Two separate primaries linked by new request:** The older contact becomes the primary; the newer primary is demoted to secondary.

### Contact Schema

```js
{
  id            // MongoDB ObjectId
  phoneNumber   // String | null
  email         // String | null
  linkedId      // ObjectId ref to primary Contact | null
  linkPrecedence // "primary" | "secondary"
  createdAt     // DateTime
  updatedAt     // DateTime
  deletedAt     // DateTime | null (soft delete)
}
```

---

## 🧪 Example Test Cases

### Case 1: New customer

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "doc@hillvalley.edu", "phoneNumber": "8885550001"}'
```

### Case 2: Returning customer with new email

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "emmett@hillvalley.edu", "phoneNumber": "8885550001"}'
```

### Case 3: Two separate contacts get linked

```bash
# First
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "george@hillvalley.edu", "phoneNumber": "919191"}'

# Second
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "biffsucks@hillvalley.edu", "phoneNumber": "717171"}'

# Linking request
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "george@hillvalley.edu", "phoneNumber": "717171"}'
```

---

## 📦 Scripts Reference

| Command        | Description                        |
|----------------|------------------------------------|
| `npm run dev`  | Start with nodemon (auto-reload)   |
| `npm start`    | Start normally with node           |
| `npm run prod` | Start in production mode           |

---

## 📝 Notes

- The API accepts JSON body (not form-data)
- `phoneNumber` is stored as a String internally for consistency
- Emails are normalized to lowercase
- Soft-delete support via `deletedAt` field
- Indexes on `email`, `phoneNumber`, and `linkedId` for performance
