# FuelEU Maritime Compliance Platform

A full-stack compliance dashboard for FuelEU Maritime regulation (EU) 2023/1805, implementing GHG intensity tracking, Compliance Balance (CB) calculation, Banking (Article 20), and Pooling (Article 21).

---

## Architecture Overview

Both frontend and backend follow **Hexagonal Architecture (Ports & Adapters / Clean Architecture)**:

```
core/
  domain/        ← Pure business entities & domain logic (no framework deps)
  application/   ← Use cases orchestrating domain objects
  ports/         ← Interfaces (contracts) that adapters must implement

adapters/
  inbound/http/  ← Express controllers — implement inbound ports
  outbound/      ← PostgreSQL repositories — implement outbound ports
  ui/            ← React components — implement inbound UI ports
  infrastructure/← Axios clients — implement outbound API ports

infrastructure/
  db/            ← DB client, migrations, seeds
  server/        ← Express app bootstrap
```

**Dependency rule:** `core` has zero dependencies on adapters/infrastructure. All dependencies point inward.

---

## Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18 + TypeScript + TailwindCSS + Recharts + TanStack Query |
| Backend   | Node.js + TypeScript + Express |
| Database  | PostgreSQL |
| Testing   | Jest + ts-jest (unit) + Supertest (integration) |

---

## Setup & Run

### Prerequisites
- Node.js ≥ 18
- PostgreSQL running locally (default port 5432)

### Backend

```bash
cd backend

# 1. Copy and configure environment
cp .env.example .env
# Edit DATABASE_URL if needed

# 2. Install dependencies
npm install

# 3. Run migrations
npm run db:migrate

# 4. Seed sample data (5 routes from spec)
npm run db:seed

# 5. Start dev server
npm run dev
# → API available at http://localhost:3001
```

### Frontend

```bash
cd frontend

# 1. Copy environment
cp .env.example .env
# Edit VITE_API_URL if backend runs on a different port

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
# → Dashboard at http://localhost:5173
```

---

## Running Tests

### Backend unit tests (no DB required)
```bash
cd backend
npm test -- --testPathPatterns=unit
```

### All backend tests
```bash
cd backend
npm test
```

---

## API Reference

### Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/routes` | List routes (filters: `vesselType`, `fuelType`, `year`) |
| POST | `/routes/:routeId/baseline` | Set a route as baseline |
| GET | `/routes/comparison` | Baseline vs all others with `percentDiff` + `compliant` |

### Compliance
| Method | Path | Description |
|--------|------|-------------|
| GET | `/compliance/cb?shipId=&year=` | Compute & store Compliance Balance |
| GET | `/compliance/adjusted-cb?shipId=&year=` | CB after bank applications |

### Banking (Article 20)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/banking/records?shipId=&year=` | Bank entry history + total |
| POST | `/banking/bank` | Bank positive CB surplus `{ shipId, year }` |
| POST | `/banking/apply` | Apply banked surplus to deficit `{ shipId, year, amount }` |

### Pools (Article 21)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/pools` | Create pool `{ year, memberShipIds[] }` |
| GET | `/pools/:id` | Retrieve pool with member allocations |

---

## Sample API Requests

```bash
# Get all routes
curl http://localhost:3001/routes

# Set R002 as baseline
curl -X POST http://localhost:3001/routes/R002/baseline

# Get comparison
curl http://localhost:3001/routes/comparison

# Compute CB for R002 in 2024
curl "http://localhost:3001/compliance/cb?shipId=R002&year=2024"

# Bank surplus for R002
curl -X POST http://localhost:3001/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId":"R002","year":2024}'

# Apply banked
curl -X POST http://localhost:3001/banking/apply \
  -H "Content-Type: application/json" \
  -d '{"shipId":"R001","year":2024,"amount":500000}'

# Create pool
curl -X POST http://localhost:3001/pools \
  -H "Content-Type: application/json" \
  -d '{"year":2024,"memberShipIds":["R001","R002","R004"]}'
```

---

## Core Formulas

```
Energy in scope (MJ) = fuelConsumption (t) × 41,000 MJ/t

Compliance Balance (gCO₂e) = (Target − Actual GHG Intensity) × Energy in scope
  → Positive = Surplus
  → Negative = Deficit

Target GHG Intensity 2025 = 89.3368 gCO₂e/MJ  (2% below 91.16)

percentDiff = ((comparison / baseline) − 1) × 100
```

---

## Seed Data

| routeId | vesselType | fuelType | year | ghgIntensity | isBaseline |
|---------|-----------|---------|------|-------------|-----------|
| R001 | Container | HFO | 2024 | 91.0 | ✓ |
| R002 | BulkCarrier | LNG | 2024 | 88.0 | |
| R003 | Tanker | MGO | 2024 | 93.5 | |
| R004 | RoRo | HFO | 2025 | 89.2 | |
| R005 | Container | LNG | 2025 | 90.5 | |
