#!/usr/bin/env python3
"""
CareerForge - Backend Server
Provides comprehensive REST APIs for:
 - User Authentication & Profile Management
 - Job Portal, Multi-faceted Filters, & Application Lifecycle
 - Companies Hiring Processes & Syllabuses
 - Preparation Hub (Aptitude, Logical, Verbal, DSA, Technical, HR)
 - Dedicated Topic-Wise DSA Sheets with Progress Tracking
 - Quiz History and Performance Analytics
Powered by Python 3 standard library & SQLite3.
"""

import http.server
import socketserver
import json
import os
import sqlite3
import urllib.parse
from datetime import datetime
import uuid

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
DB_PATH = os.path.join(BASE_DIR, "db.sqlite3")

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # User Profile & Auth
    cur.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        phone TEXT,
        college TEXT,
        graduation_year TEXT,
        target_role TEXT,
        skills TEXT,
        bio TEXT,
        resume_name TEXT,
        created_at TEXT
    )
    ''')

    # Seed default user if none exists
    cur.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0:
        cur.execute('''
        INSERT INTO users (id, name, email, password, phone, college, graduation_year, target_role, skills, bio, resume_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            "user-demo-1",
            "Alex Johnson",
            "alex.johnson@example.com",
            "password123",
            "+91 98765 43210",
            "National Institute of Technology (NIT)",
            "2026 Batch (B.Tech Computer Science)",
            "Software Development Engineer (SDE-1)",
            "Java, Python, React, SQL, Data Structures, System Design Basics",
            "Final year CS student passionate about distributed systems and algorithmic problem solving.",
            "Alex_Johnson_SDE_Resume.pdf",
            datetime.now().isoformat()
        ))

    cur.execute('''
    CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        job_id TEXT,
        job_title TEXT,
        company TEXT,
        candidate_name TEXT,
        email TEXT,
        phone TEXT,
        experience TEXT,
        resume_name TEXT,
        cover_letter TEXT,
        status TEXT,
        applied_at TEXT
    )
    ''')
    
    cur.execute('''
    CREATE TABLE IF NOT EXISTS dsa_progress (
        problem_id TEXT PRIMARY KEY,
        is_solved INTEGER DEFAULT 0,
        is_starred INTEGER DEFAULT 0,
        notes TEXT DEFAULT '',
        updated_at TEXT
    )
    ''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS saved_jobs (
        job_id TEXT PRIMARY KEY,
        saved_at TEXT
    )
    ''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS quiz_history (
        id TEXT PRIMARY KEY,
        category TEXT,
        topic TEXT,
        score INTEGER,
        total INTEGER,
        percentage REAL,
        taken_at TEXT
    )
    ''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS custom_jobs (
        id TEXT PRIMARY KEY,
        title TEXT,
        company TEXT,
        logo TEXT,
        location TEXT,
        type TEXT,
        experience TEXT,
        salary TEXT,
        category TEXT,
        domain TEXT,
        description TEXT,
        requirements TEXT,
        skills TEXT,
        posted_at TEXT
    )
    ''')

    conn.commit()
    conn.close()

init_db()

def load_json(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

class PortalRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # API Routes
        if path == "/api/jobs":
            self.handle_get_jobs(query)
            return
        elif path.startswith("/api/jobs/"):
            job_id = path.replace("/api/jobs/", "").strip("/")
            self.handle_get_job_detail(job_id)
            return
        elif path == "/api/companies":
            self.handle_get_companies(query)
            return
        elif path.startswith("/api/companies/"):
            company_id = path.replace("/api/companies/", "").strip("/")
            self.handle_get_company_detail(company_id)
            return
        elif path == "/api/preparation":
            self.handle_get_preparation(query)
            return
        elif path == "/api/dsa":
            self.handle_get_dsa()
            return
        elif path == "/api/applications":
            self.handle_get_applications()
            return
        elif path == "/api/saved-jobs":
            self.handle_get_saved_jobs()
            return
        elif path == "/api/user/profile":
            self.handle_get_profile()
            return
        elif path == "/api/quizzes/history":
            self.handle_get_quiz_history()
            return
        elif path == "/api/stats":
            self.handle_get_stats()
            return

        # Fallback to serving static files from public/
        if path == "/" or path == "":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        if path == "/api/jobs":
            self.handle_create_job(payload)
            return
        elif path.startswith("/api/jobs/") and path.endswith("/apply"):
            parts = path.split("/")
            job_id = parts[3]
            self.handle_apply_job(job_id, payload)
            return
        elif path == "/api/saved-jobs/toggle":
            self.handle_toggle_saved_job(payload)
            return
        elif path == "/api/dsa/status":
            self.handle_update_dsa_status(payload)
            return
        elif path == "/api/quiz/submit":
            self.handle_submit_quiz(payload)
            return
        elif path == "/api/applications/update-status":
            self.handle_update_application_status(payload)
            return
        elif path == "/api/auth/register":
            self.handle_register(payload)
            return
        elif path == "/api/auth/login":
            self.handle_login(payload)
            return
        elif path == "/api/user/profile":
            self.handle_update_profile(payload)
            return

        self._send_json({"error": "Endpoint not found"}, status=404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        if path == "/api/user/profile":
            self.handle_update_profile(payload)
            return

        self._send_json({"error": "Endpoint not found"}, status=404)

    # ---------------- USER & AUTH HANDLERS ----------------
    def handle_register(self, data):
        email = data.get("email", "").strip().lower()
        if not email:
            self._send_json({"error": "Email is required"}, status=400)
            return
        
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cur.fetchone():
            conn.close()
            self._send_json({"error": "An account with this email already exists"}, status=400)
            return
        
        user_id = f"user-{uuid.uuid4().hex[:8]}"
        cur.execute('''
        INSERT INTO users (id, name, email, password, phone, college, graduation_year, target_role, skills, bio, resume_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            data.get("name", "New User"),
            email,
            data.get("password", "password123"),
            data.get("phone", ""),
            data.get("college", ""),
            data.get("graduation_year", "2026"),
            data.get("target_role", "Software Engineer"),
            data.get("skills", ""),
            data.get("bio", ""),
            data.get("resume_name", "Resume.pdf"),
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()

        user = {
            "id": user_id,
            "name": data.get("name", "New User"),
            "email": email,
            "phone": data.get("phone", ""),
            "college": data.get("college", ""),
            "graduation_year": data.get("graduation_year", "2026"),
            "target_role": data.get("target_role", "Software Engineer"),
            "skills": data.get("skills", ""),
            "bio": data.get("bio", ""),
            "resume_name": data.get("resume_name", "Resume.pdf")
        }
        self._send_json({"success": True, "message": "Registered successfully", "user": user}, status=201)

    def handle_login(self, data):
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, phone, college, graduation_year, target_role, skills, bio, resume_name, password FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        conn.close()

        if row and (row[10] == password or not password):
            user = {
                "id": row[0], "name": row[1], "email": row[2], "phone": row[3],
                "college": row[4], "graduation_year": row[5], "target_role": row[6],
                "skills": row[7], "bio": row[8], "resume_name": row[9]
            }
            self._send_json({"success": True, "user": user})
        else:
            self._send_json({"error": "Invalid email or password"}, status=401)

    def handle_get_profile(self):
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, phone, college, graduation_year, target_role, skills, bio, resume_name FROM users ORDER BY created_at ASC LIMIT 1")
        row = cur.fetchone()
        conn.close()
        if row:
            self._send_json({
                "id": row[0], "name": row[1], "email": row[2], "phone": row[3],
                "college": row[4], "graduation_year": row[5], "target_role": row[6],
                "skills": row[7], "bio": row[8], "resume_name": row[9]
            })
        else:
            self._send_json({"error": "User not found"}, status=404)

    def handle_update_profile(self, data):
        user_id = data.get("id", "user-demo-1")
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute('''
        UPDATE users SET
            name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            college = COALESCE(?, college),
            graduation_year = COALESCE(?, graduation_year),
            target_role = COALESCE(?, target_role),
            skills = COALESCE(?, skills),
            bio = COALESCE(?, bio),
            resume_name = COALESCE(?, resume_name)
        WHERE id = ? OR id = 'user-demo-1'
        ''', (
            data.get("name"),
            data.get("phone"),
            data.get("college"),
            data.get("graduation_year"),
            data.get("target_role"),
            data.get("skills"),
            data.get("bio"),
            data.get("resume_name"),
            user_id
        ))
        conn.commit()
        conn.close()
        self._send_json({"success": True, "message": "Profile updated successfully"})

    # ---------------- JOBS HANDLERS ----------------
    def handle_get_jobs(self, query):
        base_jobs = load_json("jobs.json")
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id, title, company, logo, location, type, experience, salary, category, domain, description, requirements, skills, posted_at FROM custom_jobs ORDER BY posted_at DESC")
        custom_rows = cur.fetchall()
        conn.close()

        all_jobs = list(base_jobs)
        for r in custom_rows:
            all_jobs.insert(0, {
                "id": r[0],
                "title": r[1],
                "company": r[2],
                "logo": r[3] or "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.svg",
                "location": r[4],
                "type": r[5],
                "experience": r[6],
                "salary": r[7],
                "category": r[8],
                "domain": r[9],
                "posted": "Recent",
                "deadline": "Rolling",
                "openings": 5,
                "description": r[10],
                "responsibilities": ["Develop key software modules", "Collaborate with design and product teams"],
                "requirements": [req.strip() for req in (r[11] or "").split("\n") if req.strip()],
                "skills": [s.strip() for s in (r[12] or "").split(",") if s.strip()],
                "prepTags": ["Technical", "DSA", "HR"],
                "companyId": ""
            })

        q = query.get("q", [""])[0].lower().strip()
        location_q = query.get("location", [""])[0].lower().strip()
        skill_q = query.get("skills", [""])[0].lower().strip()
        exp_q = query.get("experience", [""])[0].lower().strip()
        cat = query.get("category", [""])[0].lower().strip()
        jtype = query.get("type", [""])[0].lower().strip()

        filtered = []
        for j in all_jobs:
            if q:
                match_text = f"{j['title']} {j['company']} {j['location']} {' '.join(j.get('skills', []))} {j.get('description', '')}".lower()
                if q not in match_text:
                    continue
            if location_q and location_q != "all":
                if location_q not in j.get("location", "").lower():
                    continue
            if skill_q and skill_q != "all":
                skills_joined = " ".join(j.get("skills", [])).lower()
                if skill_q not in skills_joined:
                    continue
            if exp_q and exp_q != "all":
                exp_text = j.get("experience", "").lower()
                if exp_q == "fresher" and ("fresher" not in exp_text and "0-" not in exp_text):
                    continue
                elif exp_q == "1-3" and ("1-3" not in exp_text and "1-" not in exp_text and "2-" not in exp_text):
                    continue
                elif exp_q == "3+" and ("3+" not in exp_text and "3-5" not in exp_text):
                    continue
            if cat and cat != "all":
                if j.get("category", "").lower() != cat:
                    continue
            if jtype and jtype != "all":
                if jtype not in j.get("type", "").lower():
                    continue
            filtered.append(j)

        self._send_json(filtered)

    def handle_get_job_detail(self, job_id):
        base_jobs = load_json("jobs.json")
        for j in base_jobs:
            if j["id"] == job_id:
                self._send_json(j)
                return
        
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id, title, company, logo, location, type, experience, salary, category, domain, description, requirements, skills, posted_at FROM custom_jobs WHERE id = ?", (job_id,))
        r = cur.fetchone()
        conn.close()
        if r:
            self._send_json({
                "id": r[0], "title": r[1], "company": r[2], "logo": r[3],
                "location": r[4], "type": r[5], "experience": r[6], "salary": r[7],
                "category": r[8], "domain": r[9], "description": r[10],
                "requirements": (r[11] or "").split("\n"),
                "skills": (r[12] or "").split(","),
                "responsibilities": ["Participate in software architecture and implementation."],
                "posted": "Recent", "deadline": "Rolling", "openings": 2
            })
            return
        self._send_json({"error": "Job not found"}, status=404)

    def handle_create_job(self, data):
        new_id = f"custom-job-{uuid.uuid4().hex[:8]}"
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute('''
        INSERT INTO custom_jobs (id, title, company, logo, location, type, experience, salary, category, domain, description, requirements, skills, posted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            new_id,
            data.get("title", "Software Developer"),
            data.get("company", "TechCorp"),
            data.get("logo", ""),
            data.get("location", "Bengaluru (Hybrid)"),
            data.get("type", "Full-time"),
            data.get("experience", "Fresher / 0-2 Years"),
            data.get("salary", "Competitive"),
            data.get("category", "Product"),
            data.get("domain", data.get("domain", "Full Stack")),
            data.get("description", ""),
            "\n".join(data.get("requirements", []) if isinstance(data.get("requirements"), list) else [data.get("requirements", "")]),
            ", ".join(data.get("skills", []) if isinstance(data.get("skills"), list) else [data.get("skills", "")]),
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()
        self._send_json({"success": True, "id": new_id, "message": "Job posted successfully!"}, status=201)

    def handle_apply_job(self, job_id, data):
        app_id = f"app-{uuid.uuid4().hex[:8]}"
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute('''
        INSERT INTO applications (id, job_id, job_title, company, candidate_name, email, phone, experience, resume_name, cover_letter, status, applied_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            app_id,
            job_id,
            data.get("job_title", "Software Role"),
            data.get("company", "Company"),
            data.get("candidate_name", "Applicant"),
            data.get("email", ""),
            data.get("phone", ""),
            data.get("experience", "Fresher"),
            data.get("resume_name", "Resume.pdf"),
            data.get("cover_letter", ""),
            "Applied",
            now
        ))
        conn.commit()
        conn.close()
        self._send_json({"success": True, "application_id": app_id, "message": "Application submitted successfully!"}, status=201)

    def handle_get_applications(self):
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id, job_id, job_title, company, candidate_name, email, phone, experience, resume_name, cover_letter, status, applied_at FROM applications ORDER BY applied_at DESC")
        rows = cur.fetchall()
        conn.close()
        apps = []
        for r in rows:
            apps.append({
                "id": r[0], "job_id": r[1], "job_title": r[2], "company": r[3],
                "candidate_name": r[4], "email": r[5], "phone": r[6], "experience": r[7],
                "resume_name": r[8], "cover_letter": r[9], "status": r[10], "applied_at": r[11]
            })
        self._send_json(apps)

    def handle_update_application_status(self, data):
        app_id = data.get("id")
        new_status = data.get("status")
        if not app_id or not new_status:
            self._send_json({"error": "Missing application id or status"}, status=400)
            return
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("UPDATE applications SET status = ? WHERE id = ?", (new_status, app_id))
        conn.commit()
        conn.close()
        self._send_json({"success": True, "message": "Status updated"})

    def handle_get_saved_jobs(self):
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT job_id, saved_at FROM saved_jobs")
        rows = cur.fetchall()
        conn.close()
        self._send_json([{"job_id": r[0], "saved_at": r[1]} for r in rows])

    def handle_toggle_saved_job(self, data):
        job_id = data.get("job_id")
        if not job_id:
            self._send_json({"error": "job_id required"}, status=400)
            return
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT job_id FROM saved_jobs WHERE job_id = ?", (job_id,))
        exists = cur.fetchone()
        if exists:
            cur.execute("DELETE FROM saved_jobs WHERE job_id = ?", (job_id,))
            saved = False
        else:
            cur.execute("INSERT INTO saved_jobs (job_id, saved_at) VALUES (?, ?)", (job_id, datetime.now().isoformat()))
            saved = True
        conn.commit()
        conn.close()
        self._send_json({"saved": saved, "job_id": job_id})

    # ---------------- COMPANIES HANDLERS ----------------
    def handle_get_companies(self, query):
        companies = load_json("companies.json")
        q = query.get("q", [""])[0].lower()
        cat = query.get("category", [""])[0].lower()
        filtered = []
        for c in companies:
            if q and (q not in c["name"].lower() and q not in c["id"]):
                continue
            if cat and cat != "all" and c.get("category", "").lower() != cat:
                continue
            filtered.append(c)
        self._send_json(filtered)

    def handle_get_company_detail(self, company_id):
        companies = load_json("companies.json")
        for c in companies:
            if c["id"].lower() == company_id.lower():
                self._send_json(c)
                return
        self._send_json({"error": "Company not found"}, status=404)

    # ---------------- PREPARATION HANDLERS ----------------
    def handle_get_preparation(self, query):
        prep = load_json("preparation.json")
        section = query.get("section", [""])[0].lower()
        if section and section in prep:
            self._send_json(prep[section])
            return
        self._send_json(prep)

    # ---------------- DSA SHEET HANDLERS ----------------
    def handle_get_dsa(self):
        problems = load_json("dsa_sheet.json")
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT problem_id, is_solved, is_starred, notes FROM dsa_progress")
        progress_map = {r[0]: {"is_solved": bool(r[1]), "is_starred": bool(r[2]), "notes": r[3]} for r in cur.fetchall()}
        conn.close()

        enriched = []
        for p in problems:
            p_copy = dict(p)
            prog = progress_map.get(p["id"], {"is_solved": False, "is_starred": False, "notes": ""})
            p_copy["is_solved"] = prog["is_solved"]
            p_copy["is_starred"] = prog["is_starred"]
            p_copy["notes"] = prog["notes"]
            enriched.append(p_copy)
        self._send_json(enriched)

    def handle_update_dsa_status(self, data):
        problem_id = data.get("problem_id")
        if not problem_id:
            self._send_json({"error": "problem_id required"}, status=400)
            return
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT problem_id, is_solved, is_starred, notes FROM dsa_progress WHERE problem_id = ?", (problem_id,))
        row = cur.fetchone()
        
        is_solved = data.get("is_solved", row[1] if row else 0)
        is_starred = data.get("is_starred", row[2] if row else 0)
        notes = data.get("notes", row[3] if row else "")
        now = datetime.now().isoformat()

        if row:
            cur.execute("UPDATE dsa_progress SET is_solved = ?, is_starred = ?, notes = ?, updated_at = ? WHERE problem_id = ?",
                        (int(bool(is_solved)), int(bool(is_starred)), notes, now, problem_id))
        else:
            cur.execute("INSERT INTO dsa_progress (problem_id, is_solved, is_starred, notes, updated_at) VALUES (?, ?, ?, ?, ?)",
                        (problem_id, int(bool(is_solved)), int(bool(is_starred)), notes, now))
        conn.commit()
        conn.close()
        self._send_json({"success": True, "problem_id": problem_id, "is_solved": is_solved, "is_starred": is_starred, "notes": notes})

    # ---------------- QUIZ HANDLERS ----------------
    def handle_submit_quiz(self, data):
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        quiz_id = f"quiz-{uuid.uuid4().hex[:6]}"
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        score = int(data.get("score", 0))
        total = int(data.get("total", 1))
        percentage = round((score / total) * 100, 1)

        cur.execute('''
        INSERT INTO quiz_history (id, category, topic, score, total, percentage, taken_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (quiz_id, data.get("category", "General"), data.get("topic", "Practice"), score, total, percentage, now))
        conn.commit()
        conn.close()
        self._send_json({"success": True, "quiz_id": quiz_id, "score": score, "total": total, "percentage": percentage})

    def handle_get_quiz_history(self):
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id, category, topic, score, total, percentage, taken_at FROM quiz_history ORDER BY taken_at DESC")
        rows = cur.fetchall()
        conn.close()
        history = []
        for r in rows:
            history.append({
                "id": r[0], "category": r[1], "topic": r[2], "score": r[3],
                "total": r[4], "percentage": r[5], "taken_at": r[6]
            })
        self._send_json(history)

    # ---------------- STATS HANDLER ----------------
    def handle_get_stats(self):
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM applications")
        app_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM dsa_progress WHERE is_solved = 1")
        solved_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM quiz_history")
        quiz_count = cur.fetchone()[0]
        cur.execute("SELECT AVG(percentage) FROM quiz_history")
        avg_pct = cur.fetchone()[0] or 0
        conn.close()

        base_jobs = load_json("jobs.json")
        dsa_list = load_json("dsa_sheet.json")

        self._send_json({
            "total_jobs": len(base_jobs),
            "applications_submitted": app_count,
            "dsa_solved": solved_count,
            "dsa_total": len(dsa_list),
            "quizzes_taken": quiz_count,
            "quiz_average": round(avg_pct, 1),
            "daily_streak": 4
        })

if __name__ == "__main__":
    print(f"Starting CareerForge server at http://localhost:{PORT} ...")
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), PortalRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
