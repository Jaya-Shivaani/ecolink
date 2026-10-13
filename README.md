# EcoLink – Hyperlocal Marketplace & Digital Ecosystem

EcoLink is a full-stack hyperlocal marketplace designed to connect local home growers, organic farmers, rural artisans, Self Help Groups (SHGs), and eco-friendly product makers with local customers. The project supports community carbon reduction metrics, plant exchanges, corporate bidding portals, and community workshops.

---

## 🌟 Key Features

1. **Hyperlocal Search & Map Integration:**
   - Geolocation search filter (5km to 50km radius) powered by Leaflet.js (OpenStreetMap).
   - Find products and sellers in your immediate neighborhood.
2. **Innovative Plant Loop:**
   - **Plant Adoption Board:** Donate excess plant saplings to neighborhood members for free.
   - **Plant Exchange Hub:** Swap plant babies, cuttings, or pots locally with circular trading.
3. **Business Requirement Board:**
   - Corporate offices, event decorators, or schools post bulk requirements.
   - Sellers submit quotations directly through a secure bid portal.
4. **Direct Negotiation Chat:**
   - Instant messaging system enabling Buyers and Sellers to communicate, negotiate prices, and align on pick-up logistics.
5. **Certifications & Carbon Indicators:**
   - Custom badges: *SHG Badge*, *Women Entrepreneur Badge*, *Eco-Friendly Badge*.
   - Sustainability dashboard tracking plants bought, carbon offsets saved, and community swaps completed.
6. **Role-Based Admin Console:**
   - Verification queue to validate registered sellers.
   - Global platform statistics (revenue tracking, user distributions).

---

## 🛠️ Tech Stack

- **Frontend:** React.js (Vite), Tailwind CSS, React Router, Axios, Lucide React, Leaflet.js.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (via Mongoose).
- **Authentication:** JWT, bcryptjs.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB running locally on `mongodb://127.0.0.1:27017/ecolink` or an Atlas connection string.

### Setup Instructions

1. **Clone/Navigate to the workspace directory:**
   ```bash
   cd ecolink
   ```

2. **Configure environment variables:**
   A template `.env` is created in `backend/.env`. You can edit it if you have custom credentials:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/ecolink
   JWT_SECRET=supersecretkeyforecolinkmarketplace2026
   ```

3. **Install all dependencies:**
   From the root folder, run:
   ```bash
   npm run install-all
   ```

4. **Seed the database with mock records:**
   Ensure MongoDB is running, then populate mock sellers, buyers, products, forums, and workshops:
   ```bash
   npm run seed
   ```

5. **Start the development servers:**
   Launch both the React frontend and Express backend concurrently:
   ```bash
   npm run dev
   ```
   - React app will open on `http://localhost:3000`
   - Express server will listen on `http://localhost:5000`

---

## 🔑 Demo Logins (Password for all: `password123`)

- **Admin Account:**
  - Email: `admin@ecolink.com`
- **Buyer Account:**
  - Email: `buyer@ecolink.com`
- **Seller (Verified Woman Entrepreneur):**
  - Email: `ananya@ecolink.com`
- **Seller (Verified Self Help Group):**
  - Email: `kavery@ecolink.com`
- **Seller (Pending verification review):**
  - Email: `ramesh@ecolink.com`



node backend/apply_custom_organization.js
