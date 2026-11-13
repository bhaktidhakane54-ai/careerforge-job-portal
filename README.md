# CareerForge — Job Portal & Preparation Platform 🚀

A comprehensive, all-in-one web portal and interview preparation platform built for engineering students and software job seekers (2025/2026 Batch and beyond).

> **Live Demo:** Clone and run locally (see [How to Run](#how-to-run) below).  
> **Demo Login:** `alex.johnson@example.com` / `password123`

---

## 🌟 Key Features & Modules

### 1. 💼 Job Portal
- **Curated Job Openings:** Roles from top Product companies (*Google, Amazon, Microsoft*), Service giants (*TCS, Infosys, Accenture, Wipro, Cognizant*), and Fintech leaders (*Razorpay*).
- **Multi-dimensional Filters:** Search by role, company, tech stack, category (*Product, Service, Fintech*), experience, and job type (*Full-time, Internship, Remote*).
- **Direct Application Engine:** Resume upload simulation, candidate profile auto-fill, and custom cover note submission.
- **Recruiter Simulator:** Post new job openings saved directly into the SQLite database.
- **Bookmarking:** Star/save jobs for quick review.

### 2. 📚 Comprehensive Preparation Hub

Six dedicated tracks:

| Track | Topics Covered |
|-------|---------------|
| **Quantitative Aptitude** | Time & Work, Speed-Distance-Time, Percentages, Profit & Loss, Probability, P&C |
| **Logical Reasoning** | Syllogisms, Blood Relations, Coding-Decoding, Puzzles |
| **Verbal Ability** | Subject-Verb Agreement, Dangling Modifiers, Idioms & Phrases |
| **DSA Theory** | Arrays, Sorting, Trees, Graphs, DP — concept notes |
| **Core Technical (CS)** | OS, DBMS, Computer Networks, OOPs, System Design |
| **HR Interview** | STAR Method, Top 25 HR Qs, Salary Negotiation, Body Language |

- **Interactive Quiz Arena:** Timed mock tests with live countdown, instant explanations, scoring, and persistent history.

### 3. 🏢 Companies Hiring Process & Exam Patterns

Detailed profiles for **7 top hiring companies**:  
**TCS · Infosys · Wipro · Accenture · Amazon · Google · Microsoft**

Each company page includes:
- Academic eligibility & CGPA criteria
- Online exam platform, sections, duration, and negative marking rules
- Round-by-round selection workflow
- Syllabus & focus areas
- Insider preparation tips

> *Note: Company-specific data is sample/illustrative. Always verify with official company careers pages.*

### 4. 🧩 Dedicated Topic-Wise DSA Sheets

Structured curriculum across **12 core algorithmic topics**:

| # | Topic | # | Topic |
|---|-------|---|-------|
| 1 | Arrays | 7 | Recursion & Backtracking |
| 2 | Strings | 8 | Trees |
| 3 | Linked Lists | 9 | Graphs |
| 4 | Stacks & Queues | 10 | Dynamic Programming |
| 5 | Searching & Sorting | 11 | Greedy Algorithms |
| 6 | Binary Search | 12 | Hashing |

- **Multi-Language Solutions:** Complete implementations in **C++**, **Java**, and **Python** for every problem.
- **Complexity Analysis:** Explicit Big-O Time & Space breakdown.
- **Progress Tracking:** Mark Solved/Unsolved with visual topic progress bars and overall completion percentage.

### 5. 📊 Application Tracker
- **Status Pipeline:** Applied → Under Review → Assessment Scheduled → Interview Round → Offer Received → Rejected.
- **Live Status Updater:** Change status via dropdown with instant persistence.
- **Saved Jobs Tab:** Quick access to all bookmarked listings.

### 6. 👤 User Dashboard
- Login / Register with session management.
- Profile management (name, college, skills, expected CTC).
- Saved jobs, applied jobs overview.
- Learning progress, completed quizzes & scores.
- DSA completion progress per topic.

---

## 💻 Tech Stack & Architecture

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3 Standard Library (`http.server`, `sqlite3`, `json`) — zero pip dependencies |
| **Database** | SQLite 3 (`db.sqlite3`) — applications, DSA progress, saved jobs, quiz history, custom jobs |
| **Frontend** | Vanilla ES6+ SPA, CSS Design System (responsive, light/dark-ready), embedded SVG icons |
| **Data** | JSON data files (`data/`) + bundled offline dataset (`public/data.js`) |
| **Offline Mode** | 100% functional via `localStorage` and bundled dataset — works without server |

---

## 🚀 How to Run

### Prerequisites
- Python 3.8+ (no additional packages needed)

### Method 1: Full Stack (Recommended)

```powershell
# 1. Clone the repository
git clone https://github.com/bhaktidhakane54-ai/careerforge-job-portal.git
cd careerforge-job-portal

# 2. Start the backend server
python server.py

# 3. Open in browser
# Navigate to: http://localhost:8080
```

### Method 2: Static / Offline Mode (No Server Required)

Open `public/index.html` directly in any browser:
```
# Just double-click public/index.html
```
The application automatically activates offline mode using `localStorage` for all progress tracking, bookmarks, and applications.

---

## 📁 Project Structure

```
careerforge-job-portal/
├── server.py              # Python HTTP server + REST API (port 8080)
├── README.md
├── .gitignore
├── data/
│   ├── jobs.json          # 11 curated job listings
│   ├── companies.json     # 7 company profiles
│   ├── dsa_sheet.json     # 25 problems across 12 DSA topics
│   └── preparation.json   # 6 preparation tracks (notes + questions)
└── public/
    ├── index.html         # Main SPA entry point
    ├── styles.css         # Full design system (responsive, variables)
    ├── app.js             # Core SPA logic (~1700 lines)
    ├── icons.js           # SVG icon library
    └── data.js            # Bundled offline dataset (fallback)
```

---

## 🔐 Demo Credentials

| Field | Value |
|-------|-------|
| Email | `alex.johnson@example.com` |
| Password | `password123` |

---

## 📌 Notes

- The SQLite database (`db.sqlite3`) is excluded from the repository (`.gitignore`) since it stores runtime user data. It is auto-created when you first run `server.py`.
- All company hiring process data is **illustrative/sample** — always cross-check with official sources.
- The project is intentionally dependency-free — no npm, no pip installs needed.

---

## 📄 License

MIT License — feel free to use, fork, and extend for your own preparation needs.

---

*Built with ❤️ for placement and interview preparation.*
