# HOPE, INC. — Product Management System
## Sprint Deliverables & Pull Request Expectations

**Per Role | Per Sprint | 6-Week Project Plan**
* **Prepared by:** Jeremias C. Esperanza
* **Institution:** New Era University – College of Computer Studies
* **Academic Year:** 2025–2026

---

### 1. Project Guidelines

#### 1.1 Pull Request (PR) Fundamentals
* **Definition:** A PR is a focused, reviewable unit of work pushed to a feature branch.
* **Scope:** One PR per concern; do not bundle unrelated changes.
* **Completion Criteria:** A PR is only complete once it is reviewed by at least one team member and merged into the `dev` branch.
* **The Golden Rule:** PRs must **NEVER** be merged directly into `main`.

#### 1.2 Member Roles
| Label | Role |
| :--- | :--- |
| **M1** | Project Lead |
| **M2** | Frontend Developer |
| **M3** | Database Engineer |
| **M4** | Rights & Auth Specialist |
| **M5** | QA / Documentation Specialist |

---

### 2. PR Commitment Summary
*Total Project Minimum: 45 PRs*

| Member | Sprint 1 | Sprint 2 | Sprint 3 | Total | Branch Prefix |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **M1** | 3 | 3 | 2 | **8** | `feature/*`, `hotfix/*` |
| **M2** | 4 | 4 | 3 | **11** | `feature/ui-*`, `fix/ui-*` |
| **M3** | 3 | 3 | 2 | **8** | `feature/db-*`, `fix/db-*` |
| **M4** | 4 | 3 | 3 | **10** | `feature/auth-*`, `feature/rights-*` |
| **M5** | 2 | 3 | 3 | **8** | `test/*`, `docs/*` |

---

### 3. Sprint Breakdown

#### Sprint 1: Setup & Authentication (Weeks 1-2)
**Theme:** Project setup, database initialization, and Google OAuth.

* **M1 (Project Lead):** Vite + React scaffold, Supabase client init, and routing skeleton.
* **M2 (Frontend):** Login/Register pages and App shell layout.
* **M3 (DB Engineer):** Schema execution, Rights scripts, and ERD documentation.
* **M4 (Rights/Auth):** AuthContext, OAuth configuration, and user provisioning triggers.
* **M5 (QA/Docs):** Vitest setup and authentication flow testing.

#### Sprint 2: CRUD & Rights Enforcement (Weeks 3-4)
**Theme:** Product management, soft-delete visibility, and stamp gating.

* **M1 (Project Lead):** Product and Price History API wiring.
* **M2 (Frontend):** Product tables, CRUD modals, and Price History panels.
* **M3 (DB Engineer):** RLS policies for products and Price History SQL views.
* **M4 (Rights/Auth):** UserRightsContext and UI gating for action buttons.
* **M5 (QA/Docs):** 18-case rights matrix execution and soft-delete audit.

#### Sprint 3: Reports & Finalization (Weeks 5-6)
**Theme:** Admin module, deployment, and final documentation.

* **M1 (Project Lead):** Reports API queries and production deployment (Vercel/Netlify).
* **M2 (Frontend):** Reports pages (REP_001/002) and User Management UI.
* **M3 (DB Engineer):** Top-selling products view and SUPERADMIN RLS protection.
* **M4 (Rights/Auth):** Sidebar gating and production regression testing.
* **M5 (QA/Docs):** Final E2E tests and User Manual preparation.

---

### 4. Git Standards

#### Branch & PR Naming
| Prefix | Use Case | Example |
| :--- | :--- | :--- |
| `feat/` | New features | `feat/auth-google-oauth` |
| `fix/` | Bug fixes | `fix/login-guard-redirect` |
| `db/` | Database migrations | `db/rls-product-policy` |
| `docs/` | Documentation | `docs/user-manual-draft` |

#### Pull Request Checklist
- [ ] Branch created from `dev`.
- [ ] Descriptive title using imperative mood (e.g., "Add RLS policy").
- [ ] All automated tests pass.
- [ ] No `console.log` or `.env` files included.
- [ ] Reviewed and approved by at least one teammate.
