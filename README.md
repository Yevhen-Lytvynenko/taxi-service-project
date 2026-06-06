<p align="center">
  <img src="https://cdn.discordapp.com/attachments/1075103098189651978/1512665245666115705/Group_1692_1.png?ex=6a24eaca&is=6a23994a&hm=31ea805249164a4187864c7a632fd486ed497ee98b79b9a39179c3d08b0ea878&" alt="Strum" width="96" />
</p>

<h1 align="center">Strum</h1>

<p align="center">
  <strong>Full-stack taxi service platform</strong><br/>
  passenger &amp; driver mobile apps · dispatch admin panel · REST API · real-time GPS
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/React_Native-0.74-61DAFB?logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Socket.IO-real--time-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="DEMO_INSTRUCTIONS.md">Demo Guide</a>
</p>

---

## About

**Strum** is a monorepo taxi platform that covers the full ride lifecycle: a passenger books a trip, the system matches an online driver, the fleet is monitored in real time, and finances are tracked in a single admin panel.

Key capabilities:

- JWT authentication for clients, drivers, and staff
- Order creation with geocoding, tariff calculation, and surge pricing
- Driver matching by proximity to the pickup point
- Trip status updates and live events over WebSocket
- In-trip chat, reviews, favorite/blocked contacts
- Card payments via Stripe (or cash)
- Role-based admin panel with CRUD and analytics
- **Emulation module** for demos without real drivers on the road

---

## Features

| Package | Highlights |
|---------|------------|
| **app-client** | Step-by-step booking, MapLibre map, saved places, trip history, chat, reviews |
| **app-driver** | Order queue, active trip screen, GPS tracking, earnings, saved routes, trip simulation |
| **web-admin** | Dashboard, users, drivers, orders, finance, chats, GPS logs, tariffs, live tracking, complaints |
| **backend** | Express 5 API, Prisma + PostgreSQL/PostGIS, Socket.IO, Stripe, RBAC, audit log |
| **gps-simulator** | Standalone fleet emulation (Odessa): OSRM routes, auto-orders every 45–90s |

---

## Architecture

```
                         +------------------+
                         |   gps-simulator  |
                         |  HTTP + Socket   |
                         +--------+---------+
                                  |
          +-----------+-----------+-----------+
          |           |                       |
          v           v                       v
   +-------------+ +-------------+     +-------------+
   | app-client  | | app-driver  |     |  web-admin  |
   | Expo / RN   | | Expo / RN   |     | React+Vite  |
   +------+------+ +------+------+     +------+------+
          |               |                   |
          |    REST /api    |    Socket.IO      |
          +-------+---------+---------+---------+
                  |                   |
                  v                   v
           +-------------+     +-------------+
           |  REST API   |     |  Socket.IO  |
           | Express +   |     | GPS, status |
           |   Prisma    |     |    chat     |
           +------+------+     +------+------+
                  |                   |
                  +--------+----------+
                           |
                           v
                    +-------------+
                    | PostgreSQL  |
                    |  + PostGIS  |
                    +------+------+
                           |
                    (optional)
                           v
                    +-------------+
                    |    Redis    |
                    +-------------+
```

### Monorepo layout

```
taxi-service-project/
├── packages/
│   ├── backend/          # API, Prisma, Socket.IO, business logic
│   ├── web-admin/        # React admin (MUI, Leaflet)
│   ├── app-client/       # Expo — passenger app
│   ├── app-driver/       # Expo — driver app
│   └── gps-simulator/    # Standalone GPS emulation for demos
├── docker-compose.yml    # PostgreSQL + pgAdmin
├── DEMO_INSTRUCTIONS.md
└── package.json          # npm workspaces & run scripts
```

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, Socket.IO, JWT, bcrypt, Zod, Stripe |
| **Web Admin** | React 18, Vite, MUI, React Router, Leaflet, Axios |
| **Mobile** | React Native 0.74, Expo 51, React Navigation, React Native Paper, WebView + MapLibre |
| **Maps & Geo** | OpenFreeMap, OSRM, geocoding, radius-based driver matching |
| **DevOps** | Docker Compose, npm workspaces, Vitest |

---

## Quick Start

### Prerequisites

- Node.js **18+** (20+ recommended)
- Docker Desktop (PostgreSQL)
- Expo Go or an Android/iOS emulator (for mobile apps)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/taxi-service-project.git
cd taxi-service-project
npm install
```

### 2. Database

```bash
docker compose up -d

cd packages/backend
cp .env.example .env   # configure DATABASE_URL if needed
npx prisma db push
npx prisma db seed
cd ../..
```

> PostgreSQL runs on port **15432** (see `docker-compose.yml`). pgAdmin: `http://localhost:5050`.

### 3. Run services

From the **repository root**:

```bash
npm run backend    # API + Socket.IO  -> http://localhost:4000
npm run admin      # Web admin          -> http://localhost:3000
npm run client     # Expo passenger app -> port 8081
npm run driver     # Expo driver app
```

Run everything including GPS emulation:

```bash
npm run start:all
```

Automatic fleet emulation:

```bash
npm run emulation   # alias: npm run gps-sim
```

### 4. Demo accounts

| Role | Login | Password |
|------|-------|----------|
| Passenger | `+380991111111` | `demo` |
| Driver | `demodriver` or `+380992222222` | `demo` |
| Admin | `admin` | `admin` |

Admin login: [http://localhost:3000/login](http://localhost:3000/login)

---

## Mobile apps

| Environment | API URL |
|-------------|---------|
| Android emulator | `http://10.0.2.2:4000/api` (default) |
| iOS simulator | `http://localhost:4000/api` |
| Physical device (Wi-Fi) | `http://YOUR_LAN_IP:4000/api` |

Copy `.env.example` to `.env` in `packages/app-client` and `packages/app-driver`, set `EXPO_PUBLIC_API_URL`, then restart Expo.

---

## Environment variables

<details>
<summary><b>backend</b> — <code>packages/backend/.env</code></summary>

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Token signing secret |
| `EMULATION_SECRET` | Key for `/api/emulation/*` (GPS demo) |
| `STRIPE_SECRET_KEY` | Stripe (optional; mock mode without key) |

</details>

<details>
<summary><b>gps-simulator</b> — <code>packages/gps-simulator/.env</code></summary>

| Variable | Description |
|----------|-------------|
| `SERVER_URL` | Backend URL (default `http://localhost:4000`) |
| `EMULATION_SECRET` | Same secret as in backend |

</details>

---

## API & real-time

| Channel | Purpose |
|---------|---------|
| `REST /api/*` | CRUD, auth, orders, tariffs, reviews |
| `Socket.IO` | `update_location`, order status, admin monitoring |
| `REST /api/emulation/*` | Service API for GPS simulator (`X-Emulation-Secret` header) |

---

## Testing

```bash
cd packages/backend
npm test
```

Emulation API integration tests: `tests/emulation-guard.test.ts`.

---

## Demo scenarios

See **[DEMO_INSTRUCTIONS.md](./DEMO_INSTRUCTIONS.md)** for step-by-step guides:

1. **Manual demo** — passenger books, driver accepts and runs trip simulation.
2. **Auto emulation** — `npm run emulation` fills the admin dashboard with live trips.

---

## License

Built for educational purposes. License: **ISC** (see `package.json`).  
Commercial use requires separate legal and technical review.

---

<p align="center">
  <sub>Strum · next-generation taxi platform</sub>
</p>
