# DeadLockGuard – Intelligent OS Deadlock Detection & Recovery Platform

[![Operating System Course Project](https://img.shields.io/badge/Course-OSDS--Project-cyan.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-React_|_Node.js_|_Express_|_MongoDB-purple.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

DeadLockGuard is a state-of-the-art full-stack Operating System web platform built for visualizing, detecting, avoiding, preventing, and recovering from resource deadlocks. Designed specifically as a university Operating Systems course project, it combines robust algorithm implementations with interactive visual graphs.

---

## 🌟 Key Features

1. **Dashboard & Telemetry**: Real-time stats (Total Processes, Resources, Available vs Allocated instances, Active Simulations, Deadlocks Detected, Recoveries) with Recharts visualizations.
2. **Process & Resource Management**: Full CRUD operations for processes (READY, RUNNING, WAITING, BLOCKED, COMPLETED, DEADLOCKED) and multi-instance resources.
3. **Interactive Allocation Matrix**: Edit Allocation $[Allocation[i][j]]$ and Request $[Request[i][j]]$ matrices and validate bounds.
4. **Deadlock Detection Algorithm**: Standard OS detection algorithm execution with educational step-by-step trace.
5. **Banker's Algorithm**: Complete Banker's algorithm implementation for safety sequence calculation ($Need = Max - Allocation$) and resource-request simulation.
6. **Resource Allocation Graph (RAG) & Cycle Detection**: Interactive graph built with `@xyflow/react` featuring automated DFS cycle detection and educational notes regarding single vs multi-instance resources.
7. **Deadlock Recovery Engine**: Interventions via Process Termination (abort process and reclaim resources) and Resource Preemption.
8. **Deadlock Prevention Module**: Interactive breakdown of Coffman's 4 necessary conditions (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait) and hierarchy ordering simulation ($R1 < R2 < R3$).
9. **Strategy Comparison**: Detailed comparison table comparing Detection vs Avoidance vs Prevention trade-offs and complexity.
10. **Simulation History & Reports**: MongoDB-backed execution history with search/filter capabilities and formal print/PDF report generator.
11. **Role-Based Auth System**: JWT authentication with bcrypt password hashing for Admin and User/Student roles.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (Vite), React Router v6, Tailwind CSS, Recharts, `@xyflow/react` (React Flow), Lucide Icons, Axios.
* **Backend**: Node.js, Express.js, REST API architecture, JWT (`jsonwebtoken`), `bcryptjs`, `dotenv`.
* **Database**: MongoDB / MongoDB Atlas, Mongoose ODM.

---

## 📁 Repository Directory Structure

```text
deadlock-detection-system/
│
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # Sidebar, Navbar, Toast, ProtectedRoute
│   │   ├── context/             # AuthContext & Notification Toast State
│   │   ├── layouts/             # DashboardLayout
│   │   ├── pages/               # All 15+ UI pages
│   │   ├── services/            # Axios API Service endpoints
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # Node.js + Express Backend
│   ├── algorithms/              # OS Algorithm implementations
│   │   ├── deadlockDetection.js
│   │   ├── bankersAlgorithm.js
│   │   ├── cycleDetection.js
│   │   └── recovery.js
│   ├── controllers/             # Express API controllers
│   ├── middleware/              # Auth & Role verification middleware
│   ├── models/                  # Mongoose Schemas (User, Process, Resource, Simulation)
│   ├── routes/                  # API Route Definitions
│   ├── seed.js                  # Database seed script for quick viva demo
│   ├── server.js                # Express app entry point
│   └── package.json
│
├── package.json                 # Monorepo root scripts
└── README.md
```

---

## 🚀 Quick Setup & Installation Guide

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+ recommended)
* [MongoDB](https://www.mongodb.com/) (Local server running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI)

### 1. Install All Dependencies
From the workspace root directory:
```bash
npm run install-all
```

### 2. Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/deadlock_system
JWT_SECRET=deadlock_guard_super_secret_jwt_key_2026
NODE_ENV=development
```

### 3. Seed Demo Data (Recommended for Viva Demonstration)
Populates initial sample accounts, processes, resources, and deadlock scenarios:
```bash
npm run seed
```

### 4. Run Development Servers
Start both backend (Port 5000) and frontend (Port 3000) concurrently:
```bash
npm run dev
```

Visit `http://localhost:3000` in your web browser.

---

## 🔑 Demo Account Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **User / Student** | `student@deadlockguard.com` | `student123` |
| **Administrator** | `admin@deadlockguard.com` | `admin123` |

---

## 📡 REST API Endpoint Documentation

### Authentication
* `POST /api/auth/register` - User registration
* `POST /api/auth/login` - User login & JWT issuance
* `GET  /api/auth/me` - Profile fetch

### Core Algorithms
* `POST /api/deadlock/detect` - Run Deadlock Detection algorithm
* `POST /api/deadlock/bankers` - Run Banker's Safety & Request algorithms
* `POST /api/deadlock/cycles` - Run RAG Cycle Detection
* `POST /api/deadlock/recover` - Execute Termination or Preemption recovery

### Management
* `GET / POST / PUT / DELETE /api/processes` - Process CRUD
* `GET / POST / PUT / DELETE /api/resources` - Resource CRUD
* `GET / POST / DELETE /api/simulations` - Simulation history
* `GET /api/dashboard/stats` - Analytics statistics

---

## 🎓 Viva Explanation Guide

If asked by your course examiner:
* **"Why is a cycle not always a deadlock?"**
  > When resources have **multiple instances**, a cycle in the Resource Allocation Graph is a *necessary* condition but *not a sufficient* condition. A process in the cycle might acquire an instance released by a process outside the cycle. However, for **single-instance resources**, a cycle is both necessary and sufficient.
* **"How does Banker's Algorithm avoid deadlocks?"**
  > Banker's algorithm calculates the $Need = Max - Allocation$ matrix and ensures that resources are allocated only if the resulting state remains in a **Safe State**—meaning there exists at least one sequence ($\langle P_1, P_2, \dots, P_n \rangle$) in which all processes can execute to completion without deadlocking.

---

## 📄 License
This project is released under the MIT License.
