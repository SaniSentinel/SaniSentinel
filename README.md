# 🌿 SaniSentinel
 
**Climate-Resilient Sanitation Monitoring & Alert System**
> UNICEF StartUp Lab Hackathon Challenge 2026 — Northern Ghana
 
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://sanissentinel.vercel.app)
[![Backend on Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![SMS via Africa's Talking](https://img.shields.io/badge/SMS-Africa's%20Talking-E2231A)](https://africastalking.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
 
---
 
## 📋 Table of Contents
 
- [Overview](#-overview)
- [The Problem](#-the-problem)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
- [Database Setup](#-database-setup)
- [Edge Functions](#-edge-functions)
- [SMS Format Guide](#-sms-format-guide)
- [Risk Scoring Model](#-risk-scoring-model)
- [Deployment](#-deployment)
- [Team](#-team)
---
 
## 🌍 Overview
 
SaniSentinel is a lightweight, **offline-capable sanitation monitoring platform** built for communities in Northern Ghana. It gives sanitation workers, district health officers, and local government authorities **real-time visibility** into the condition of sanitation facilities — and sends **early warnings** before climate events (floods, droughts) cause infrastructure failure.
 
The system works entirely over **SMS** for field workers — no smartphone, no internet, no app installation needed. A **GIS web dashboard** gives district officers a live, colour-coded map of every registered facility and an automated **maintenance scheduler** dispatches teams before facilities fail.
 
---
 
## 🚨 The Problem
 
Northern Ghana's sanitation infrastructure is under growing pressure from climate shocks. Seasonal flooding (May–October) and drought (November–April) routinely damage toilets, contaminate water sources, and disrupt the full sanitation service chain — from containment to treatment. By the time failures are discovered, the damage has already impacted community health.
 
**Key gaps SaniSentinel addresses:**
 
| Gap | Impact |
|-----|--------|
| No real-time facility monitoring | Failures only found reactively, after damage |
| Fragmented data across districts | No consolidated view for health officers |
| No climate linkage | No way to anticipate flood/drought impact on facilities |
| Poor coordination | Workers, officers, and authorities operate in silos |
| No maintenance scheduling | Emptying and repairs happen ad hoc |
| Smartphone/internet dependency | Existing tools don't work in rural, low-connectivity areas |
 
---
 
## ⚙️ How It Works
 
```
Field Layer
  SMS / USSD reports  +  Open-Meteo climate API  +  (optional IoT sensors)
          │
          ▼
  SaniSentinel Data Hub  (Supabase)
  ┌─────────────────────────────────────────────────────┐
  │  inbound-sms  →  reports table                      │
  │  fetch-climate  →  climate_snapshots table           │
  │  score-risk  →  updates facility risk scores         │
  │  send-sms-alert  →  Africa's Talking SMS dispatch    │
  │  DB trigger  →  auto-creates maintenance tasks       │
  └─────────────────────────────────────────────────────┘
          │
          ▼
  Coordination Layer
  GIS Dashboard (Leaflet)  +  Admin Reports  +  Maintenance Panel
          │
          ▼
  Alert Outputs
  SMS to field workers  +  Live map updates  +  District summaries
```
 
**Every 6 hours:**
1. `fetch-climate` pulls rainfall and flood risk data from Open-Meteo for all registered districts
2. `score-risk` combines climate data + facility reports + maintenance history into a **0–100 risk score** per facility
3. Facilities that cross the **critical threshold (score ≥ 85)** trigger an SMS alert to the assigned worker and auto-create a maintenance task
4. The GIS dashboard updates in real time via Supabase Realtime WebSockets
---
 
## 🛠 Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Map / GIS | Leaflet.js |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime (WebSockets) |
| Auth | Supabase Auth (email/password) |
| Backend Logic | Supabase Edge Functions (Deno) |
| SMS / USSD | Africa's Talking |
| Climate Data | Open-Meteo API (free, no key required) |
| Scheduler | pg_cron (PostgreSQL extension) |
| Deployment | Vercel (frontend) + Supabase Cloud (backend) |
 
---
 
## 📁 Project Structure
 
```
sanissentinel/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── MapView.jsx           # GIS dashboard — main page
│   │   ├── Dashboard.jsx         # Summary stat cards
│   │   ├── Reports.jsx           # All facility reports table
│   │   ├── Maintenance.jsx       # Maintenance task management
│   │   └── Workers.jsx           # Worker admin panel
│   ├── components/
│   │   ├── MapMarker.jsx         # Colour-coded facility markers
│   │   ├── FacilityPopup.jsx     # Click-to-view facility details
│   │   ├── AlertSidebar.jsx      # Live realtime alerts feed
│   │   ├── StatCard.jsx          # Dashboard summary cards
│   │   └── AddFacilityForm.jsx   # Click-on-map to register facilities
│   ├── hooks/
│   │   ├── useAlerts.js          # Supabase Realtime subscription
│   │   ├── useFacilities.js
│   │   ├── useReports.js
│   │   ├── useMaintenance.js
│   │   └── useAuth.js
│   ├── lib/
│   │   ├── supabase.js           # Supabase client config
│   │   ├── riskColors.js         # Status → colour mapping
│   │   └── formatters.js         # Date/score formatting helpers
│   └── services/
│       ├── facilityService.js
│       ├── reportService.js
│       └── workerService.js
├── supabase/
│   ├── functions/
│   │   ├── fetch-climate/        # Pulls Open-Meteo data
│   │   │   └── index.ts
│   │   ├── score-risk/           # Computes facility risk scores
│   │   │   └── index.ts
│   │   ├── send-sms-alert/       # Dispatches SMS via Africa's Talking
│   │   │   └── index.ts
│   │   └── inbound-sms/          # Parses incoming field SMS reports
│   │       └── index.ts
│   ├── migrations/
│   │   ├── 001_districts.sql
│   │   ├── 002_facilities.sql
│   │   ├── 003_reports.sql
│   │   ├── 004_alerts.sql
│   │   ├── 005_workers.sql
│   │   ├── 006_maintenance_tasks.sql
│   │   ├── 007_climate_snapshots.sql
│   │   └── 008_triggers_and_rls.sql
│   └── seed/
│       └── seed.sql              # 15 sample facilities across Tamale
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```
 
---
 
## 🚀 Getting Started
 
### Prerequisites
 
- [Node.js](https://nodejs.org) v18 or higher
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `npm install -g supabase`
- [Git](https://git-scm.com)
- A free [Supabase account](https://supabase.com)
- A free [Africa's Talking sandbox account](https://africastalking.com)
---
 
### Environment Variables
 
Copy the example file and fill in your values:
 
```bash
cp .env.example .env
```
 
**.env.example**
 
```env
# Supabase — get these from your Supabase project settings
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
 
# Africa's Talking — use sandbox credentials for local development
VITE_AT_USERNAME=sandbox
AT_API_KEY=your-africastalking-api-key
AT_USERNAME=sandbox
AT_SHORTCODE=your-shortcode
 
# Set to 'development' locally, 'production' on Vercel
VITE_APP_ENV=development
```
 
> ⚠️ **Never commit your `.env` file to GitHub.** It is already listed in `.gitignore`.
>
> The `VITE_` prefix exposes variables to the React frontend. Variables without it (like `AT_API_KEY`) are for Edge Functions only and are set as Supabase secrets — they never touch the frontend.
 
---
 
### Installation
 
```bash
# Clone the repository
git clone https://github.com/your-team/sanissentinel.git
cd sanissentinel
 
# Install frontend dependencies
npm install
 
# Log in to Supabase CLI
supabase login
 
# Link to your Supabase project
supabase link --project-ref your-project-id
```
 
---
 
### Running Locally
 
**Start the frontend:**
 
```bash
npm run dev
# App runs at http://localhost:5173
```
 
**Start Supabase Edge Functions locally:**
 
```bash
supabase functions serve
# Functions run at http://localhost:54321/functions/v1/
```
 
**Apply database migrations:**
 
```bash
supabase db push
```
 
**Seed the database with sample data:**
 
```bash
psql $(supabase db connection-string) -f supabase/seed/seed.sql
```
 
---
 
## 🗄 Database Setup
 
The system uses 7 tables in Supabase (PostgreSQL). All tables have Row Level Security (RLS) enabled. Supabase Realtime is enabled on `alerts` and `reports`.
 
| Table | Purpose |
|-------|---------|
| `districts` | Registered districts (id, name, region, lat, lng) |
| `facilities` | Sanitation facilities (type, location, status, risk_score) |
| `reports` | Field condition reports submitted via SMS or dashboard |
| `alerts` | System-generated alerts when facilities reach risk thresholds |
| `workers` | Sanitation workers with phone numbers and district assignments |
| `maintenance_tasks` | Auto-generated and manually created maintenance work orders |
| `climate_snapshots` | Historical climate data fetched from Open-Meteo per district |
 
Migrations are in `/supabase/migrations/`. Run them in order with `supabase db push`.
 
---
 
## ☁️ Edge Functions
 
Four Supabase Edge Functions handle all backend logic:
 
### `fetch-climate`
- **Trigger:** pg_cron — every 6 hours
- **What it does:** Calls the Open-Meteo API for each district's rainfall forecast and flood risk indicator, then inserts a new row into `climate_snapshots`
- **API:** `https://api.open-meteo.com/v1/forecast` (free, no key)
### `score-risk`
- **Trigger:** pg_cron — 30 min after `fetch-climate`, every 6 hours
- **What it does:** Reads latest climate snapshot + most recent facility report, computes a composite risk score, updates `facility.status` and `facility.risk_score`
- **Score formula:**
  ```
  risk_score = (flood_risk × 0.5) + (days_since_serviced/90 × 100 × 0.3) + (condition_weight × 0.2)
  ```
 
### `send-sms-alert`
- **Trigger:** Called by `score-risk` when a facility transitions to `critical`
- **What it does:** Sends an SMS to the assigned district worker via Africa's Talking API
### `inbound-sms`
- **Trigger:** HTTP POST webhook from Africa's Talking on every incoming SMS
- **What it does:** Parses the SMS report format, inserts into `reports` table, sends confirmation SMS back to the sender
**Deploy all functions:**
 
```bash
supabase functions deploy fetch-climate
supabase functions deploy score-risk
supabase functions deploy send-sms-alert
supabase functions deploy inbound-sms
```
 
**Set Edge Function secrets (never in .env — these are server-only):**
 
```bash
supabase secrets set AT_API_KEY=your-key
supabase secrets set AT_USERNAME=sandbox
supabase secrets set AT_SHORTCODE=your-shortcode
```
 
---
 
## 📱 SMS Format Guide
 
Field workers send reports by SMS to the Africa's Talking shortcode. No smartphone or internet required — any basic phone works.
 
### Report Format
 
```
F{facility_id}#{block}#{CONDITION}
```
 
### Example
 
```
F12#2#OVERFLOW
```
 
> Facility ID 12 → Block 2 → Condition: OVERFLOW
 
### Valid Condition Codes
 
| Code | Meaning |
|------|---------|
| `GOOD` | Facility is clean and functioning normally |
| `DAMAGED` | Physical damage to structure or fittings |
| `OVERFLOW` | Waste has overflowed or pit is full |
| `DRY` | No water supply — system cannot function |
| `BLOCKED` | Drain or pipe is blocked |
 
### Confirmation Response
 
After a successful report, the worker receives:
 
```
Report received for Facility 12, Block 2: OVERFLOW. Thank you. — SaniSentinel
```
 
### Invalid Format Response
 
```
Invalid format. Please use: F{ID}#{BLOCK}#{CONDITION}
Valid conditions: GOOD, DAMAGED, OVERFLOW, DRY, BLOCKED
Example: F12#2#OVERFLOW
```
 
---
 
## 📊 Risk Scoring Model
 
Every facility gets a risk score from **0 to 100**, recalculated every 6 hours.
 
### Score Formula
 
```
risk_score = (flood_risk_score × 0.5)
           + (min(days_since_serviced / 90, 1) × 100 × 0.3)
           + (condition_weight × 0.2)
```
 
### Condition Weights
 
| Condition | Weight |
|-----------|--------|
| GOOD | 0 |
| DAMAGED | 40 |
| DRY | 50 |
| BLOCKED | 60 |
| OVERFLOW | 100 |
 
### Status Thresholds
 
| Score Range | Status | Map Colour | Action |
|-------------|--------|------------|--------|
| 0 – 29 | `good` | 🟢 Green | No action needed |
| 30 – 59 | `at_risk` | 🟡 Amber | Monitor closely |
| 60 – 84 | `high_risk` | 🔴 Red | Inspect within 72 hours |
| 85 – 100 | `critical` | ⚫ Black | Immediate action — SMS alert sent |
 
---
 
## 🌐 Deployment
 
### Frontend → Vercel
 
```bash
# Install Vercel CLI
npm install -g vercel
 
# Deploy
vercel
 
# Set environment variables in Vercel dashboard:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```
 
Or connect your GitHub repo directly to [vercel.com](https://vercel.com) for automatic deployments on every push to `main`.
 
### Backend → Supabase Cloud
 
```bash
# Push database schema
supabase db push
 
# Deploy all edge functions
supabase functions deploy --all
 
# Set production secrets
supabase secrets set AT_API_KEY=your-production-key
```
 
### Register the Inbound SMS Webhook
 
In your Africa's Talking dashboard:
1. Go to **SMS → Inbox → Manage Shortcodes**
2. Set the callback URL to:
   ```
   https://your-project-id.supabase.co/functions/v1/inbound-sms
   ```
 
---
 
## 👥 Team
 
| Name | Role |
|------|------|
| | Team Lead / Project Manager |
| | Backend Developer |
| | Frontend Developer |
| | QA / Testing Lead |
 
**Institution:** University for Development Studies, Nyankpala Campus
**Department:** Computer Science — 2025/2026
**Challenge:** UNICEF StartUp Lab Hackathon 2026 — Climate-Resilient WASH Systems
 
---
 
## 📄 License
 
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
 
---
 
<div align="center">
  <strong>Built for communities. Designed for resilience. Powered by open source.</strong>
  <br/>
  <em>SaniSentinel — protecting sanitation systems before climate shocks strike.</em>
</div>
