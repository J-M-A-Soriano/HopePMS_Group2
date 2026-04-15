# HopePMS Enterprise Portal

![HopePMS Analytics & Masterlist](https://img.shields.io/badge/Status-Production%20Ready-green?style=for-the-badge) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

HopePMS is a high-performance **Product Management System** engineered for enterprise data integrity, secure hierarchical role-based access control (RBAC), and real-time ledger synchronization.

Built using React, Vite, and Supabase, HopePMS strictly isolates historical data footprints for pricing architectures while exposing a sleek, responsive Glassmorphism dashboard for operational visibility.

---

## 💎 Core Features

- **Dynamic Sync Ledger**: A cross-table pricing engine dynamically maps real-time product prices against an immutable `pricehist` ledger. 
- **Automated Audit Tracking**: All price modifications automatically trigger a background SQL UPSERT, guaranteeing that business-critical pricing adjustments strictly maintain a historical timestamped footprint.
- **Hierarchical RLS Engine**: Deep integration with PostgreSQL Row Level Security (RLS) ensures absolute data privacy. Users are rigidly assigned tiers (USER, ADMIN, SUPERADMIN) regulating their read/write capabilities natively at the database level.
- **Login Guard Protocols**: Newly registered accounts are inherently flagged as `INACTIVE` and physically intercepted from the database tables until explicit SUPERADMIN authorization is granted. 
- **Action Verification**: Catastrophic actions (terminating staff, wiping modules) demand dual-step confirmation modal prompts.

---

## 🛠 Tech Stack

| Domain | Technology |
|---|---|
| **Frontend Framework** | React 18, Vite |
| **Language** | TypeScript |
| **Styling** | TailwindCSS + Lucide Icons |
| **Database & Auth** | Supabase (PostgreSQL + PostgREST) |
| **Data Visualization** | Recharts |
| **Hosting** | Netlify (Optimized SPA Routing) |

---

## 🚀 Environment Setup

If you are cloning this repository to run locally, you strictly need the database tokens for Supabase.

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Configure Environment Variables**
   Create a `.env.local` file in the root directory. This explicitly powers the API client.
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
   🚨 *Do NOT commit this file.`.gitignore` guarantees this file is blocked.*

3. **Boot the Server**
   ```bash
   npm run dev
   ```

---

## 🗄️ Database Architecture & Migrations

To stand up a fresh clone of this project in your own Supabase Cloud instance, execute the raw SQL files located in `docs/db/migrations/` sequentially inside your Supabase SQL Editor:

1. `01_rls_product_select.sql` - Establishes fundamental table blueprints and primary keys.
2. `02_provision_user_trigger.sql` - Bootstraps automated intercept protocols for Supabase Auth.
3. `02_rls_product_write.sql` - Populates bulk product and departmental test data.
4. `07_inject_prices.sql` - Populates the historical pricing ledger securely.
5. `08_unlock_price_rls.sql` - Bypasses frontend read barriers securely to connect the React Dashboard to the PostgreSQL Ledger.

> **Warning:** Row Level Security (RLS) is strictly enforced globally across this application. Ensure you inject the `08_unlock_price_rls.sql` patch, otherwise your pricing dashboard will mathematically compute to `$0.00` to unconditionally protect the data from unauthorized generic reads.

---

## 🔒 Security Best Practices Implemented
* Strict lowercase column conventions to bypass case-sensitivity engine traps on PostgREST.
* `replaceState` logic embedded in the `Login.tsx` pipeline to safely strip warning payloads from cached HTTP requests before the DOM explicitly locks them to the active memory stack.
* Netlify `_redirects` rule `/* /index.html 200` guarantees flawless React Router hydration on strict HTTP reloads.

---
*Developed by Group 2 for the SMT Engineering Track.*
