/**
 * CareerForge - Front-end Single Page Application (SPA)
 * Complete Implementation:
 *  - User Authentication & Profile Management
 *  - Job Portal with Multi-faceted Search (Title, Company, Location, Experience, Skills, Type)
 *  - Preparation Hub (Aptitude, Logical, Verbal, DSA Theory, Core CS, HR Interview, Timed Quizzes)
 *  - Companies Hiring Process (TCS, Infosys, Wipro, Accenture, Amazon, Google, Microsoft)
 *  - Dedicated DSA Sheets (12 Topics, C++/Java/Python solutions, Progress Tracking)
 *  - User Dashboard (Profile, Learning Stats, Application Tracking, Quiz History, Saved Jobs)
 */

const state = {
  activeRoute: 'dashboard',
  user: null,
  jobs: [],
  applications: [],
  savedJobs: new Set(),
  companies: [],
  prep: {},
  dsa: [],
  stats: {},
  quizHistory: [],
  jobFilters: { q: '', location: '', experience: 'all', skills: 'all', category: 'all', type: 'all' },
  companyFilters: { q: '', category: 'all' },
  prepSubTab: 'aptitude',
  dsaFilters: { topic: 'all', difficulty: 'all', search: '', status: 'all' },
  quiz: null,
  activeProblemId: null
};

// API Helper
async function api(endpoint, method = 'GET', body = null) {
  try {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(endpoint, options);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API Error on ${endpoint}:`, err);
    return null;
  }
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast`;
  const icon = type === 'success' ? Icons.checkCircle : Icons.x;
  toast.innerHTML = `<span style="color: ${type === 'success' ? '#10b981' : '#ef4444'}">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// Modal Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
  }
});

// Theme Toggle
function initTheme() {
  const btn = document.getElementById('btn-theme-toggle');
  if (!btn) return;
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  btn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}

// Initialize Navigation Icons
function initNavIcons() {
  const setIcon = (id, iconHtml) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = iconHtml;
  };
  setIcon('nav-icon-home', Icons.barChart);
  setIcon('nav-icon-jobs', Icons.briefcase);
  setIcon('nav-icon-tracker', Icons.fileText);
  setIcon('nav-icon-prep', Icons.bookOpen);
  setIcon('nav-icon-companies', Icons.building);
  setIcon('nav-icon-dsa', Icons.code);
  setIcon('nav-icon-plus', Icons.plus);
}

// Routing
function handleRouting() {
  const hash = window.location.hash || '#/dashboard';
  const route = hash.replace('#/', '').split('?')[0] || 'dashboard';
  state.activeRoute = route;

  // Update Nav Active state
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-route') === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  renderView();
}

window.addEventListener('hashchange', handleRouting);

// ----------------------------------------------------
// USER AUTH & PROFILE MANAGEMENT
// ----------------------------------------------------
function updateUserHeader() {
  const avatarEl = document.getElementById('header-user-avatar');
  const nameEl = document.getElementById('header-user-name');
  if (!avatarEl || !nameEl) return;

  if (state.user) {
    const initials = state.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    avatarEl.textContent = initials;
    nameEl.textContent = state.user.name;
  } else {
    avatarEl.textContent = '?';
    nameEl.textContent = 'Sign In';
  }
}

function openAuthOrProfileModal() {
  if (state.user) {
    openProfileModal();
  } else {
    openModal('modal-auth');
  }
}

function switchAuthTab(tab) {
  const btnLogin = document.getElementById('auth-tab-login');
  const btnReg = document.getElementById('auth-tab-register');
  const formLogin = document.getElementById('form-login');
  const formReg = document.getElementById('form-register');
  const title = document.getElementById('auth-modal-title');

  if (tab === 'login') {
    btnLogin.classList.add('active');
    btnReg.classList.remove('active');
    formLogin.style.display = 'block';
    formReg.style.display = 'none';
    title.textContent = 'Account Sign In';
  } else {
    btnLogin.classList.remove('active');
    btnReg.classList.add('active');
    formLogin.style.display = 'none';
    formReg.style.display = 'block';
    title.textContent = 'Create Candidate Account';
  }
}

function openProfileModal() {
  if (!state.user) return;
  const u = state.user;

  document.getElementById('modal-profile-avatar').textContent = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  document.getElementById('modal-profile-header-name').textContent = u.name;
  document.getElementById('modal-profile-header-email').textContent = u.email;

  document.getElementById('prof-name').value = u.name || '';
  document.getElementById('prof-phone').value = u.phone || '';
  document.getElementById('prof-college').value = u.college || '';
  document.getElementById('prof-grad').value = u.graduation_year || '';
  document.getElementById('prof-role').value = u.target_role || '';
  document.getElementById('prof-skills').value = u.skills || '';
  document.getElementById('prof-resume').value = u.resume_name || '';
  document.getElementById('prof-bio').value = u.bio || '';

  openModal('modal-profile');
}

function logoutUser() {
  state.user = null;
  localStorage.removeItem('cf_user');
  closeModal('modal-profile');
  updateUserHeader();
  showToast('Signed out successfully');
  renderView();
}

// ----------------------------------------------------
// LOAD INITIAL DATA (HYBRID REST + LOCALSTORAGE)
// ----------------------------------------------------
async function loadInitialData() {
  const fallback = window.DEFAULT_DATA || { jobs: [], companies: [], prep: {}, dsa: [] };

  try {
    const [jobs, apps, saved, companies, prep, dsa, stats, user, qHistory] = await Promise.all([
      api('/api/jobs'),
      api('/api/applications'),
      api('/api/saved-jobs'),
      api('/api/companies'),
      api('/api/preparation'),
      api('/api/dsa'),
      api('/api/stats'),
      api('/api/user/profile'),
      api('/api/quizzes/history')
    ]);

    // Load or set user
    state.user = user || JSON.parse(localStorage.getItem('cf_user') || 'null') || {
      id: 'user-demo-1',
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      phone: '+91 98765 43210',
      college: 'National Institute of Technology (NIT)',
      graduation_year: '2026 Batch (B.Tech Computer Science)',
      target_role: 'Software Development Engineer (SDE-1)',
      skills: 'Java, Python, React, SQL, Data Structures, System Design Basics',
      bio: 'Final year CS student passionate about distributed systems and algorithmic problem solving.',
      resume_name: 'Alex_Johnson_SDE_Resume.pdf'
    };
    localStorage.setItem('cf_user', JSON.stringify(state.user));
    updateUserHeader();

    state.jobs = jobs || JSON.parse(localStorage.getItem('cf_jobs') || 'null') || fallback.jobs;
    state.applications = apps || JSON.parse(localStorage.getItem('cf_apps') || '[]');

    if (saved) {
      state.savedJobs = new Set(saved.map(s => s.job_id));
    } else {
      state.savedJobs = new Set(JSON.parse(localStorage.getItem('cf_saved_jobs') || '[]'));
    }

    state.companies = companies || fallback.companies;
    state.prep = prep || fallback.prep;

    if (dsa) {
      state.dsa = dsa;
    } else {
      const localDsaProg = JSON.parse(localStorage.getItem('cf_dsa_prog') || '{}');
      state.dsa = fallback.dsa.map(p => ({
        ...p,
        is_solved: localDsaProg[p.id]?.is_solved || false,
        is_starred: localDsaProg[p.id]?.is_starred || false,
        notes: localDsaProg[p.id]?.notes || ''
      }));
    }

    state.quizHistory = qHistory || JSON.parse(localStorage.getItem('cf_quiz_history') || '[]');

    state.stats = stats || {
      total_jobs: state.jobs.length,
      applications_submitted: state.applications.length,
      dsa_solved: state.dsa.filter(p => p.is_solved).length,
      dsa_total: state.dsa.length,
      quizzes_taken: state.quizHistory.length,
      quiz_average: 85,
      daily_streak: 4
    };
  } catch (e) {
    console.warn('API sync warning, using local storage:', e);
    state.user = JSON.parse(localStorage.getItem('cf_user') || 'null') || {
      id: 'user-demo-1',
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      phone: '+91 98765 43210',
      college: 'National Institute of Technology (NIT)',
      graduation_year: '2026 Batch',
      target_role: 'Software Development Engineer',
      skills: 'Java, Python, React, SQL, Data Structures',
      bio: 'Final year CS student passionate about engineering scalable software.',
      resume_name: 'Alex_Johnson_Resume.pdf'
    };
    updateUserHeader();
    state.jobs = JSON.parse(localStorage.getItem('cf_jobs') || 'null') || fallback.jobs;
    state.applications = JSON.parse(localStorage.getItem('cf_apps') || '[]');
    state.savedJobs = new Set(JSON.parse(localStorage.getItem('cf_saved_jobs') || '[]'));
    state.companies = fallback.companies;
    state.prep = fallback.prep;
    const localDsaProg = JSON.parse(localStorage.getItem('cf_dsa_prog') || '{}');
    state.dsa = fallback.dsa.map(p => ({
      ...p,
      is_solved: localDsaProg[p.id]?.is_solved || false,
      is_starred: localDsaProg[p.id]?.is_starred || false,
      notes: localDsaProg[p.id]?.notes || ''
    }));
    state.quizHistory = JSON.parse(localStorage.getItem('cf_quiz_history') || '[]');
    state.stats = {
      total_jobs: state.jobs.length,
      applications_submitted: state.applications.length,
      dsa_solved: state.dsa.filter(p => p.is_solved).length,
      dsa_total: state.dsa.length,
      quizzes_taken: state.quizHistory.length,
      quiz_average: 85,
      daily_streak: 4
    };
  }

  renderView();
}

// ----------------------------------------------------
// VIEW ROUTER
// ----------------------------------------------------
function renderView() {
  const root = document.getElementById('app-root');
  if (!root) return;

  switch (state.activeRoute) {
    case 'dashboard':
      renderDashboard(root);
      break;
    case 'jobs':
      renderJobs(root);
      break;
    case 'tracker':
      renderTracker(root);
      break;
    case 'preparation':
      renderPreparation(root);
      break;
    case 'companies':
      renderCompanies(root);
      break;
    case 'dsa':
      renderDSA(root);
      break;
    default:
      renderDashboard(root);
  }
}

// ==========================================
// 1. USER DASHBOARD VIEW
// ==========================================
function renderDashboard(root) {
  const solvedCount = state.dsa.filter(p => p.is_solved).length;
  const totalDsa = state.dsa.length || 25;
  const dsaPercent = Math.round((solvedCount / totalDsa) * 100);

  const easySolved = state.dsa.filter(p => p.difficulty === 'Easy' && p.is_solved).length;
  const easyTotal = state.dsa.filter(p => p.difficulty === 'Easy').length;
  const medSolved = state.dsa.filter(p => p.difficulty === 'Medium' && p.is_solved).length;
  const medTotal = state.dsa.filter(p => p.difficulty === 'Medium').length;
  const hardSolved = state.dsa.filter(p => p.difficulty === 'Hard' && p.is_solved).length;
  const hardTotal = state.dsa.filter(p => p.difficulty === 'Hard').length || 1;

  const savedJobsList = state.jobs.filter(j => state.savedJobs.has(j.id));
  const user = state.user || { name: 'Alex Johnson', email: 'alex@example.com', target_role: 'Software Engineer', college: 'NIT' };

  root.innerHTML = `
    <!-- User Profile Banner Card -->
    <div class="profile-banner-card">
      <div class="profile-main-info">
        <div class="profile-avatar-lg">
          ${user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <h2 style="font-size: 1.45rem; font-weight: 800; margin: 0;">${user.name}</h2>
            <span class="badge badge-easy">Active Candidate</span>
          </div>
          <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 3px;">
            ${user.target_role || 'Software Engineer'} • ${user.college || 'Engineering Institute'}
          </div>
          <div class="profile-meta-tags">
            <span class="skill-tag">${user.graduation_year || '2026 Batch'}</span>
            <span class="skill-tag">${user.email}</span>
            ${user.phone ? `<span class="skill-tag">${user.phone}</span>` : ''}
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn btn-outline btn-sm" onclick="openProfileModal()">
          ${Icons.edit || '✎'} Edit Profile
        </button>
        <button class="btn btn-primary btn-sm" onclick="setPrepTab('aptitude'); window.location.hash='#/preparation';">
          ${Icons.bookOpen} Resume Preparation
        </button>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--primary-light); color: var(--primary);">
          ${Icons.briefcase}
        </div>
        <div>
          <div class="stat-number">${state.applications.length}</div>
          <div class="stat-label">Jobs Applied</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--success-bg); color: var(--success);">
          ${Icons.checkCircle}
        </div>
        <div>
          <div class="stat-number">${solvedCount} / ${totalDsa}</div>
          <div class="stat-label">DSA Solved (${dsaPercent}%)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--warning-bg); color: var(--warning);">
          ${Icons.award}
        </div>
        <div>
          <div class="stat-number">${state.quizHistory.length}</div>
          <div class="stat-label">Quizzes Completed</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--purple-bg); color: var(--purple);">
          ${Icons.flame}
        </div>
        <div>
          <div class="stat-number">${state.stats.daily_streak || 4} Days</div>
          <div class="stat-label">Learning Streak</div>
        </div>
      </div>
    </div>

    <!-- Learning & Preparation Progress Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; margin-bottom: 32px;">
      
      <!-- DSA Progress Matrix -->
      <div class="notes-card" style="margin: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 1.15rem; font-weight: 700;">DSA Sheet Progress (12 Topics)</h3>
          <a href="#/dsa" class="btn btn-outline btn-sm">Open Sheet &rarr;</a>
        </div>
        
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; font-weight: 600;">
            <span>Overall Completion</span>
            <span>${solvedCount} of ${totalDsa} Solved (${dsaPercent}%)</span>
          </div>
          <div class="progress-track" style="width: 100%; height: 10px;">
            <div class="progress-fill" style="width: ${dsaPercent}%;"></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px;">
          <div style="padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-sm); text-align: center;">
            <div style="font-size: 0.75rem; color: #059669; font-weight: 700; text-transform: uppercase;">Easy</div>
            <div style="font-size: 1.1rem; font-weight: 800;">${easySolved}/${easyTotal}</div>
          </div>
          <div style="padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-sm); text-align: center;">
            <div style="font-size: 0.75rem; color: #d97706; font-weight: 700; text-transform: uppercase;">Medium</div>
            <div style="font-size: 1.1rem; font-weight: 800;">${medSolved}/${medTotal}</div>
          </div>
          <div style="padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-sm); text-align: center;">
            <div style="font-size: 0.75rem; color: #dc2626; font-weight: 700; text-transform: uppercase;">Hard</div>
            <div style="font-size: 1.1rem; font-weight: 800;">${hardSolved}/${hardTotal}</div>
          </div>
        </div>

        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Mastered Patterns: Two Pointers, Sliding Window, Monotonic Stack, Tree Postorder, Kahn's BFS.
        </div>
      </div>

      <!-- Quick Actions & Daily Challenge -->
      <div class="notes-card" style="margin: 0; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span class="badge badge-primary">Daily Pick</span>
            <span class="badge badge-easy">Array & Hashing</span>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 6px;">Two Sum</h3>
          <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 14px;">
            Find indices of two numbers that sum up to a target using optimal O(N) hash map lookup.
          </p>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
            <span class="skill-tag">Google</span>
            <span class="skill-tag">Amazon</span>
            <span class="skill-tag">TCS Digital</span>
            <span class="skill-tag">Wipro</span>
          </div>
        </div>
        <button class="btn btn-primary" onclick="openProblemModal('dsa-hash-1')">
          ${Icons.code} Solve Problem in Modal
        </button>
      </div>
    </div>

    <!-- Recent Applications & Quizzes Section -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; margin-bottom: 32px;">
      
      <!-- Submitted Applications -->
      <div class="notes-card" style="margin: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 1.15rem; font-weight: 700;">My Recent Applications</h3>
          <a href="#/tracker" class="btn btn-outline btn-sm">Full Tracker &rarr;</a>
        </div>
        ${state.applications.length === 0 ? `
          <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.9rem;">
            No applications submitted yet. Browse jobs and click "Apply" to track them here!
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${state.applications.slice(0, 4).map(app => `
              <div style="padding: 10px 14px; background: var(--bg-tertiary); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; font-size: 0.9rem;">${app.job_title}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${app.company} • ${app.applied_at}</div>
                </div>
                <span class="badge ${getStatusBadgeClass(app.status)}">${app.status}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Completed Quizzes & Tests History -->
      <div class="notes-card" style="margin: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 1.15rem; font-weight: 700;">Completed Quizzes & Scores</h3>
          <button class="btn btn-outline btn-sm" onclick="setPrepTab('quiz'); window.location.hash='#/preparation';">
            Take New Quiz &rarr;
          </button>
        </div>
        ${state.quizHistory.length === 0 ? `
          <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.9rem;">
            No quizzes completed yet. Test your Aptitude or Technical CS knowledge to record scores!
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${state.quizHistory.slice(0, 4).map(q => `
              <div style="padding: 10px 14px; background: var(--bg-tertiary); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; font-size: 0.9rem;">${q.topic}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${q.category} • ${q.taken_at}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 800; font-size: 0.95rem; color: ${q.percentage >= 70 ? 'var(--success)' : 'var(--warning)'};">${q.score}/${q.total} (${q.percentage}%)</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>

    <!-- Bookmarked Jobs Row -->
    <div style="margin-bottom: 32px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h3 style="font-size: 1.25rem; font-weight: 700;">Saved Opportunities (${savedJobsList.length})</h3>
        <a href="#/jobs" class="btn btn-outline btn-sm">Explore More Jobs &rarr;</a>
      </div>
      ${savedJobsList.length === 0 ? `
        <div style="padding: 24px; background: var(--bg-card); border-radius: var(--radius-md); text-align: center; border: 1px dashed var(--border-color); color: var(--text-muted); font-size: 0.9rem;">
          No bookmarked jobs. Click the star on any job card to save it for quick reference!
        </div>
      ` : `
        <div class="cards-grid">
          ${savedJobsList.slice(0, 3).map(job => renderJobCardHtml(job)).join('')}
        </div>
      `}
    </div>
  `;
}

// ==========================================
// 2. JOB PORTAL VIEW
// ==========================================
function renderJobs(root) {
  const filteredJobs = filterJobsList();

  root.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
      <div>
        <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 4px;">Job Portal & Verified Openings</h1>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Search and apply for engineering roles across top Product companies, Service recruiters, and Fintech giants.</p>
      </div>
      <button class="btn btn-primary" onclick="openModal('modal-post-job')">
        ${Icons.plus} Post a Job Opening
      </button>
    </div>

    <!-- Multi-faceted Search & Filter Bar -->
    <div class="filter-bar" style="flex-direction: column; gap: 14px; align-items: stretch;">
      <!-- Row 1: Search Inputs -->
      <div class="filter-row">
        <div class="search-input-wrap" style="flex: 2;">
          ${Icons.search}
          <input type="text" id="job-search-input" class="search-input" placeholder="Search by role, company, or keywords..." value="${state.jobFilters.q}">
        </div>

        <div class="search-input-wrap" style="flex: 1; min-width: 180px;">
          ${Icons.mapPin}
          <input type="text" id="job-location-input" class="search-input" placeholder="Location (e.g. Bengaluru, Pune, Remote)..." value="${state.jobFilters.location}">
        </div>
      </div>

      <!-- Row 2: Dropdowns & Pills -->
      <div class="filter-row" style="justify-content: space-between;">
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Experience:</span>
          <select class="filter-select" id="job-exp-select" onchange="setJobExp(this.value)">
            <option value="all" ${state.jobFilters.experience === 'all' ? 'selected' : ''}>All Experience</option>
            <option value="fresher" ${state.jobFilters.experience === 'fresher' ? 'selected' : ''}>Fresher (0-1 Yrs)</option>
            <option value="1-3" ${state.jobFilters.experience === '1-3' ? 'selected' : ''}>1 - 3 Years</option>
            <option value="3+" ${state.jobFilters.experience === '3+' ? 'selected' : ''}>3+ Years</option>
          </select>

          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Top Skills:</span>
          <select class="filter-select" id="job-skill-select" onchange="setJobSkill(this.value)">
            <option value="all" ${state.jobFilters.skills === 'all' ? 'selected' : ''}>All Skills</option>
            <option value="java" ${state.jobFilters.skills === 'java' ? 'selected' : ''}>Java</option>
            <option value="python" ${state.jobFilters.skills === 'python' ? 'selected' : ''}>Python</option>
            <option value="react" ${state.jobFilters.skills === 'react' ? 'selected' : ''}>React / Frontend</option>
            <option value="c++" ${state.jobFilters.skills === 'c++' ? 'selected' : ''}>C++</option>
            <option value="sql" ${state.jobFilters.skills === 'sql' ? 'selected' : ''}>SQL / Databases</option>
            <option value="cloud" ${state.jobFilters.skills === 'cloud' ? 'selected' : ''}>Cloud / AWS</option>
          </select>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Category:</span>
          <button class="filter-pill ${state.jobFilters.category === 'all' ? 'active' : ''}" onclick="setJobCategory('all')">All</button>
          <button class="filter-pill ${state.jobFilters.category === 'product' ? 'active' : ''}" onclick="setJobCategory('product')">Product</button>
          <button class="filter-pill ${state.jobFilters.category === 'service' ? 'active' : ''}" onclick="setJobCategory('service')">Service</button>
          <button class="filter-pill ${state.jobFilters.category === 'fintech' ? 'active' : ''}" onclick="setJobCategory('fintech')">Fintech</button>

          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; margin-left: 8px;">Type:</span>
          <button class="filter-pill ${state.jobFilters.type === 'all' ? 'active' : ''}" onclick="setJobType('all')">All</button>
          <button class="filter-pill ${state.jobFilters.type === 'full-time' ? 'active' : ''}" onclick="setJobType('full-time')">Full-time</button>
          <button class="filter-pill ${state.jobFilters.type === 'internship' ? 'active' : ''}" onclick="setJobType('internship')">Internship</button>
        </div>
      </div>
    </div>

    <!-- Active Filter Chips / Reset -->
    ${(state.jobFilters.q || state.jobFilters.location || state.jobFilters.experience !== 'all' || state.jobFilters.skills !== 'all' || state.jobFilters.category !== 'all' || state.jobFilters.type !== 'all') ? `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 0.88rem;">
        <div>Showing <strong>${filteredJobs.length}</strong> matching opening(s)</div>
        <button class="btn btn-outline btn-sm" onclick="resetJobFilters()">Clear All Filters</button>
      </div>
    ` : ''}

    <!-- Jobs Grid -->
    ${filteredJobs.length === 0 ? `
      <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 6px;">No openings match your search filters</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">Try adjusting your location, keywords, or experience level.</p>
        <button class="btn btn-outline" onclick="resetJobFilters()">Reset Filters</button>
      </div>
    ` : `
      <div class="cards-grid">
        ${filteredJobs.map(job => renderJobCardHtml(job)).join('')}
      </div>
    `}
  `;

  // Attach search listeners
  const searchInput = document.getElementById('job-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.jobFilters.q = e.target.value;
      renderJobs(root);
      const updated = document.getElementById('job-search-input');
      if (updated) { updated.focus(); updated.setSelectionRange(updated.value.length, updated.value.length); }
    });
  }

  const locInput = document.getElementById('job-location-input');
  if (locInput) {
    locInput.addEventListener('input', (e) => {
      state.jobFilters.location = e.target.value;
      renderJobs(root);
      const updated = document.getElementById('job-location-input');
      if (updated) { updated.focus(); updated.setSelectionRange(updated.value.length, updated.value.length); }
    });
  }
}

function filterJobsList() {
  return state.jobs.filter(job => {
    if (state.jobFilters.q) {
      const match = `${job.title} ${job.company} ${job.location} ${(job.skills || []).join(' ')} ${job.description || ''}`.toLowerCase();
      if (!match.includes(state.jobFilters.q.toLowerCase())) return false;
    }
    if (state.jobFilters.location) {
      if (!job.location.toLowerCase().includes(state.jobFilters.location.toLowerCase())) return false;
    }
    if (state.jobFilters.skills !== 'all') {
      const skillsStr = (job.skills || []).join(' ').toLowerCase();
      if (!skillsStr.includes(state.jobFilters.skills.toLowerCase())) return false;
    }
    if (state.jobFilters.experience !== 'all') {
      const expStr = (job.experience || '').toLowerCase();
      if (state.jobFilters.experience === 'fresher' && !expStr.includes('fresher') && !expStr.includes('0-')) return false;
      if (state.jobFilters.experience === '1-3' && !expStr.includes('1-3') && !expStr.includes('1-') && !expStr.includes('2-')) return false;
      if (state.jobFilters.experience === '3+' && !expStr.includes('3+') && !expStr.includes('3-5')) return false;
    }
    if (state.jobFilters.category !== 'all' && (job.category || '').toLowerCase() !== state.jobFilters.category) {
      return false;
    }
    if (state.jobFilters.type !== 'all' && !(job.type || '').toLowerCase().includes(state.jobFilters.type)) {
      return false;
    }
    return true;
  });
}

function setJobCategory(cat) { state.jobFilters.category = cat; renderView(); }
function setJobType(type) { state.jobFilters.type = type; renderView(); }
function setJobExp(exp) { state.jobFilters.experience = exp; renderView(); }
function setJobSkill(skill) { state.jobFilters.skills = skill; renderView(); }
function resetJobFilters() {
  state.jobFilters = { q: '', location: '', experience: 'all', skills: 'all', category: 'all', type: 'all' };
  renderView();
}

function renderJobCardHtml(job) {
  const isSaved = state.savedJobs.has(job.id);
  const isApplied = state.applications.some(a => a.job_id === job.id);

  return `
    <div class="job-card">
      <div>
        <div class="job-header">
          <img src="${job.logo || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.svg'}" class="company-logo" alt="${job.company}" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.svg'">
          <div class="job-title-group">
            <h3 class="job-role-title">${job.title}</h3>
            <div class="company-name">${job.company}</div>
          </div>
          <button class="star-btn ${isSaved ? 'starred' : ''}" title="${isSaved ? 'Remove from Saved' : 'Save Job'}" onclick="toggleSaveJob('${job.id}')">
            ${isSaved ? Icons.starFilled : Icons.star}
          </button>
        </div>

        <div class="job-meta-list">
          <div class="job-meta-item">${Icons.mapPin} <span>${job.location}</span></div>
          <div class="job-meta-item">${Icons.briefcase} <span>${job.experience}</span></div>
          <div class="job-meta-item"><span class="badge badge-neutral">${job.type}</span></div>
          <div class="job-meta-item"><span class="badge badge-primary">${job.category}</span></div>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${job.description}
        </p>

        <div class="job-skills">
          ${(job.skills || []).slice(0, 4).map(s => `<span class="skill-tag">${s}</span>`).join('')}
          ${(job.skills || []).length > 4 ? `<span class="skill-tag">+${job.skills.length - 4} more</span>` : ''}
        </div>
      </div>

      <div class="job-footer">
        <div class="job-salary">${job.salary}</div>
        <div class="job-actions">
          <button class="btn btn-outline btn-sm" onclick="openJobDetailModal('${job.id}')">
            Details
          </button>
          ${isApplied ? `
            <span class="badge badge-easy" style="padding: 6px 12px;">${Icons.check} Applied</span>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="openApplyJobModal('${job.id}')">
              Apply
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

// Toggle Save Job
async function toggleSaveJob(jobId) {
  let saved = !state.savedJobs.has(jobId);
  try {
    const res = await api('/api/saved-jobs/toggle', 'POST', { job_id: jobId });
    if (res && res.saved !== undefined) saved = res.saved;
  } catch (e) {
    console.warn('Backend sync deferred:', e);
  }

  if (saved) {
    state.savedJobs.add(jobId);
    showToast('Job saved to your dashboard!');
  } else {
    state.savedJobs.delete(jobId);
    showToast('Job removed from saved list');
  }
  localStorage.setItem('cf_saved_jobs', JSON.stringify(Array.from(state.savedJobs)));
  renderView();
}

// Modal: Open Job Details
function openJobDetailModal(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;

  document.getElementById('mjd-title').textContent = job.title;
  document.getElementById('mjd-company').textContent = `${job.company} • ${job.location} • ${job.type}`;
  document.getElementById('mjd-logo').src = job.logo || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.svg';

  const body = document.getElementById('mjd-body');
  body.innerHTML = `
    <div style="display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
      <div><strong>Salary / CTC:</strong> <span style="color: #059669; font-weight: 700;">${job.salary}</span></div>
      <div><strong>Experience:</strong> ${job.experience}</div>
      <div><strong>Category:</strong> ${job.category}</div>
      <div><strong>Openings:</strong> ${job.openings || 'Multiple'}</div>
    </div>

    <h4 style="font-weight: 700; margin-bottom: 8px;">Role Overview</h4>
    <p style="color: var(--text-secondary); margin-bottom: 20px; line-height: 1.6;">${job.description}</p>

    <h4 style="font-weight: 700; margin-bottom: 8px;">Key Responsibilities</h4>
    <ul style="margin-left: 20px; margin-bottom: 20px; color: var(--text-secondary); line-height: 1.6;">
      ${(job.responsibilities || []).map(r => `<li>${r}</li>`).join('')}
    </ul>

    <h4 style="font-weight: 700; margin-bottom: 8px;">Eligibility & Requirements</h4>
    <ul style="margin-left: 20px; margin-bottom: 20px; color: var(--text-secondary); line-height: 1.6;">
      ${(job.requirements || []).map(r => `<li>${r}</li>`).join('')}
    </ul>

    <h4 style="font-weight: 700; margin-bottom: 8px;">Recommended Preparation</h4>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
      ${(job.prepTags || []).map(tag => `<a href="#/preparation" class="badge badge-primary" style="text-decoration: none; padding: 6px 12px;">Study ${tag}</a>`).join('')}
      ${job.companyId ? `<a href="#/companies" class="badge badge-neutral" style="text-decoration: none; padding: 6px 12px;">View ${job.company} Exam Pattern &rarr;</a>` : ''}
    </div>
  `;

  const btnApply = document.getElementById('mjd-btn-apply');
  const isApplied = state.applications.some(a => a.job_id === job.id);
  if (isApplied) {
    btnApply.textContent = 'Already Applied';
    btnApply.disabled = true;
  } else {
    btnApply.textContent = 'Direct Apply Now';
    btnApply.disabled = false;
    btnApply.onclick = () => {
      closeModal('modal-job-detail');
      openApplyJobModal(job.id);
    };
  }

  openModal('modal-job-detail');
}

// Modal: Open Apply Job (Auto-filled from user profile)
function openApplyJobModal(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;

  document.getElementById('maj-job-id').value = job.id;
  document.getElementById('maj-job-title').textContent = job.title;
  document.getElementById('maj-company').textContent = `${job.company} • ${job.location}`;

  // Auto-fill from state.user
  if (state.user) {
    document.getElementById('maj-name').value = state.user.name || '';
    document.getElementById('maj-email').value = state.user.email || '';
    document.getElementById('maj-phone').value = state.user.phone || '';
    document.getElementById('maj-resume').value = state.user.resume_name || 'Resume_2026.pdf';
  }

  openModal('modal-apply-job');
}

// ==========================================
// 3. APPLICATION TRACKER VIEW
// ==========================================
function renderTracker(root) {
  const savedJobsList = state.jobs.filter(j => state.savedJobs.has(j.id));

  root.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 4px;">My Applications & Saved Jobs</h1>
      <p style="color: var(--text-muted); font-size: 0.95rem;">Track the real-time hiring lifecycle of your submitted job applications and review bookmarked opportunities.</p>
    </div>

    <!-- Tracker Stats -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--primary-light); color: var(--primary);">${Icons.fileText}</div>
        <div>
          <div class="stat-number">${state.applications.length}</div>
          <div class="stat-label">Total Applied</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--warning-bg); color: var(--warning);">${Icons.clock}</div>
        <div>
          <div class="stat-number">${state.applications.filter(a => a.status === 'Applied' || a.status === 'Under Review').length}</div>
          <div class="stat-label">Under Review</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--purple-bg); color: var(--purple);">${Icons.user}</div>
        <div>
          <div class="stat-number">${state.applications.filter(a => a.status === 'Interview Round').length}</div>
          <div class="stat-label">Interview Rounds</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--success-bg); color: var(--success);">${Icons.award}</div>
        <div>
          <div class="stat-number">${state.applications.filter(a => a.status === 'Offer Received').length}</div>
          <div class="stat-label">Offers Received</div>
        </div>
      </div>
    </div>

    <!-- Applications Table -->
    <div class="notes-card" style="padding: 0; overflow: hidden; margin-bottom: 32px;">
      <div style="padding: 16px 20px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.1rem; font-weight: 700;">Submitted Applications (${state.applications.length})</h3>
        <span style="font-size: 0.85rem; color: var(--text-muted);">Syncing live with candidate profile</span>
      </div>

      ${state.applications.length === 0 ? `
        <div style="padding: 40px 20px; text-align: center;">
          <p style="color: var(--text-muted); margin-bottom: 14px;">You haven't submitted any applications yet.</p>
          <a href="#/jobs" class="btn btn-primary btn-sm">Browse Live Openings & Apply</a>
        </div>
      ` : `
        <div style="overflow-x: auto;">
          <table class="dsa-table">
            <thead>
              <tr>
                <th>Company & Role</th>
                <th>Candidate Name</th>
                <th>Applied Date</th>
                <th>Resume</th>
                <th>Current Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              ${state.applications.map(app => `
                <tr>
                  <td>
                    <div style="font-weight: 700;">${app.job_title}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">${app.company}</div>
                  </td>
                  <td>
                    <div>${app.candidate_name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${app.email}</div>
                  </td>
                  <td>${app.applied_at}</td>
                  <td><span class="skill-tag">${app.resume_name}</span></td>
                  <td>
                    <span class="badge ${getStatusBadgeClass(app.status)}">${app.status}</span>
                  </td>
                  <td>
                    <select class="form-control" style="padding: 4px 8px; font-size: 0.82rem; width: auto;" onchange="updateAppStatus('${app.id}', this.value)">
                      <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
                      <option value="Under Review" ${app.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                      <option value="Assessment Scheduled" ${app.status === 'Assessment Scheduled' ? 'selected' : ''}>Assessment</option>
                      <option value="Interview Round" ${app.status === 'Interview Round' ? 'selected' : ''}>Interview Round</option>
                      <option value="Offer Received" ${app.status === 'Offer Received' ? 'selected' : ''}>Offer Received</option>
                      <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <!-- Saved Jobs Section -->
    <div>
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 14px;">Bookmarked / Saved Jobs (${savedJobsList.length})</h3>
      ${savedJobsList.length === 0 ? `
        <div style="padding: 28px; background: var(--bg-card); border-radius: var(--radius-md); text-align: center; border: 1px dashed var(--border-color); color: var(--text-muted);">
          No bookmarked jobs. Click the star icon on any job card to save it here for quick reference!
        </div>
      ` : `
        <div class="cards-grid">
          ${savedJobsList.map(job => renderJobCardHtml(job)).join('')}
        </div>
      `}
    </div>
  `;
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Offer Received': return 'badge-easy';
    case 'Interview Round': return 'badge-primary';
    case 'Assessment Scheduled': return 'badge-medium';
    case 'Rejected': return 'badge-hard';
    default: return 'badge-neutral';
  }
}

async function updateAppStatus(appId, newStatus) {
  const app = state.applications.find(a => a.id === appId);
  if (app) app.status = newStatus;
  localStorage.setItem('cf_apps', JSON.stringify(state.applications));
  showToast(`Application status updated to "${newStatus}"!`);
  renderView();

  try {
    await api('/api/applications/update-status', 'POST', { id: appId, status: newStatus });
  } catch (err) {
    console.warn('Backend sync deferred:', err);
  }
}

// ==========================================
// 4. PREPARATION HUB VIEW (6 SEPARATE SECTIONS + QUIZ)
// ==========================================
function renderPreparation(root) {
  root.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 4px;">Comprehensive Preparation Hub</h1>
      <p style="color: var(--text-muted); font-size: 0.95rem;">Master all placement requirements across 6 dedicated preparation tracks with notes, formula sheets, practice problems, and timed tests.</p>
    </div>

    <!-- 6 Separate Sub-Navigation Tabs -->
    <div class="sub-nav-tabs">
      <button class="sub-tab-btn ${state.prepSubTab === 'aptitude' ? 'active' : ''}" onclick="setPrepTab('aptitude')">
        ${Icons.bookOpen} Aptitude (Quant)
      </button>
      <button class="sub-tab-btn ${state.prepSubTab === 'logical' ? 'active' : ''}" onclick="setPrepTab('logical')">
        ${Icons.layers} Logical Reasoning
      </button>
      <button class="sub-tab-btn ${state.prepSubTab === 'verbal' ? 'active' : ''}" onclick="setPrepTab('verbal')">
        ${Icons.fileText} Verbal Ability
      </button>
      <button class="sub-tab-btn ${state.prepSubTab === 'dsa' ? 'active' : ''}" onclick="setPrepTab('dsa')">
        ${Icons.code} DSA Theory & Patterns
      </button>
      <button class="sub-tab-btn ${state.prepSubTab === 'technical' ? 'active' : ''}" onclick="setPrepTab('technical')">
        ${Icons.cpu} Technical (Core CS)
      </button>
      <button class="sub-tab-btn ${state.prepSubTab === 'hr' ? 'active' : ''}" onclick="setPrepTab('hr')">
        ${Icons.user} HR & Behavioral
      </button>
      <button class="sub-tab-btn ${state.prepSubTab === 'quiz' ? 'active' : ''}" onclick="setPrepTab('quiz')">
        ${Icons.award} Interactive Quiz Arena
      </button>
    </div>

    <div id="prep-subtab-content">
      ${renderPrepSubContent()}
    </div>
  `;
}

function setPrepTab(tab) {
  state.prepSubTab = tab;
  renderView();
}

function renderPrepSubContent() {
  switch (state.prepSubTab) {
    case 'aptitude':
      return renderStandardPrepTrack('aptitude', 'Quantitative Aptitude');
    case 'logical':
      return renderStandardPrepTrack('logical', 'Logical Reasoning');
    case 'verbal':
      return renderStandardPrepTrack('verbal', 'Verbal Ability & English');
    case 'dsa':
      return renderDsaTheoryTrack();
    case 'technical':
      return renderTechnicalSection();
    case 'hr':
      return renderHRSection();
    case 'quiz':
      return renderQuizSection();
    default:
      return renderStandardPrepTrack('aptitude', 'Quantitative Aptitude');
  }
}

// Reusable track renderer for Aptitude, Logical, Verbal
function renderStandardPrepTrack(key, displayName) {
  const data = state.prep[key] || { notes: [], questions: [] };
  const notes = data.notes || [];
  const questions = data.questions || [];

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2 style="font-size: 1.35rem; font-weight: 700;">${data.title || displayName}</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">${data.description || 'Comprehensive placement notes and practice questions.'}</p>
      </div>
      <button class="btn btn-primary" onclick="startPracticeQuiz('${displayName}', '${displayName} Practice')">
        ${Icons.award} Take Timed ${displayName} Test
      </button>
    </div>

    <!-- Notes & Formulas Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; margin-bottom: 28px;">
      ${notes.map(n => `
        <div class="notes-card" style="margin: 0;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--primary); margin-bottom: 6px;">${n.subtopic}</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5;">${n.summary}</p>
          ${n.formula ? `<div class="formula-box">${n.formula}</div>` : ''}
          ${n.keyTip ? `<div class="tip-box"><strong>Key Strategy:</strong> ${n.keyTip}</div>` : ''}
        </div>
      `).join('')}
    </div>

    <!-- Practice Problems with Toggleable Answers -->
    <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 14px;">Curated Practice Problems & Step-by-Step Solutions</h3>
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${questions.map((q, idx) => `
        <div class="practice-item">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="font-weight: 700; font-size: 0.95rem;">Q${idx + 1}: ${q.question}</div>
            <span class="badge badge-neutral">${q.topic || displayName}</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-bottom: 10px;">
            ${(q.options || []).map((opt, oIdx) => `
              <div style="padding: 6px 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 0.85rem;">
                <strong>${String.fromCharCode(65 + oIdx)}.</strong> ${opt}
              </div>
            `).join('')}
          </div>

          <button class="solution-toggle-btn" onclick="toggleSolutionBox('sol-${q.id}')">
            ${Icons.checkCircle} Toggle Answer & Step-by-Step Explanation
          </button>

          <div id="sol-${q.id}" class="solution-box" style="display: none;">
            <div style="font-weight: 700; color: #059669; margin-bottom: 4px;">Correct Option: ${String.fromCharCode(65 + q.correct)} (${q.options[q.correct]})</div>
            <div style="color: var(--text-secondary);">${q.explanation}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function toggleSolutionBox(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

// DSA Theory Track
function renderDsaTheoryTrack() {
  const dsaTheory = state.prep.dsa || { notes: [], questions: [] };

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2 style="font-size: 1.35rem; font-weight: 700;">DSA Theory & Algorithmic Patterns</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Core algorithmic concepts, Big-O analysis, and pattern cheat sheets before coding.</p>
      </div>
      <a href="#/dsa" class="btn btn-primary">
        ${Icons.code} Open Topic-Wise DSA Sheets &rarr;
      </a>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; margin-bottom: 28px;">
      ${(dsaTheory.notes || []).map(n => `
        <div class="notes-card" style="margin: 0;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--primary); margin-bottom: 8px;">${n.heading}</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">${n.content}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// Technical Core CS Section
function renderTechnicalSection() {
  const tech = state.prep.technical || {};
  const subjects = tech.subjects || [];

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2 style="font-size: 1.35rem; font-weight: 700;">Core Computer Science Subjects</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Operating Systems, DBMS, Computer Networks, Object-Oriented Design, and System Architecture.</p>
      </div>
      <button class="btn btn-primary" onclick="startPracticeQuiz('Technical', 'Core CS Subjects')">
        ${Icons.award} Take Technical CS Test
      </button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px;">
      ${subjects.map(s => `
        <div class="notes-card" style="margin: 0; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center;">
              ${Icons[s.icon] || Icons.cpu}
            </div>
            <h3 style="font-size: 1.2rem; font-weight: 700;">${s.title}</h3>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px;">
            ${(s.notes || []).map(n => `
              <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                <div style="font-weight: 700; margin-bottom: 4px; color: var(--primary);">${n.heading}</div>
                <div style="font-size: 0.87rem; color: var(--text-secondary); line-height: 1.5;">${n.content}</div>
              </div>
            `).join('')}
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 14px;">
            <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Top Interview Question:</div>
            ${s.questions && s.questions[0] ? `
              <div style="font-size: 0.85rem; margin-bottom: 6px;"><strong>Q:</strong> ${s.questions[0].question}</div>
              <div style="font-size: 0.8rem; color: #059669; font-weight: 600;">Answer: ${s.questions[0].options[s.questions[0].correct]}</div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// HR Section
function renderHRSection() {
  const hr = state.prep.hr || {};
  const star = hr.starMethod || { steps: [] };
  const questions = hr.questions || [];

  return `
    <!-- STAR Method Guide -->
    <div class="notes-card" style="margin-bottom: 28px; background: linear-gradient(135deg, rgba(37,99,235,0.04), rgba(139,92,246,0.06));">
      <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 6px;">The STAR Behavioral Interview Technique</h2>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 20px;">
        Top tech recruiters evaluate culture fit, ownership, and integrity using the STAR framework.
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        ${(star.steps || []).map(step => `
          <div style="background: var(--bg-card); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; margin-bottom: 10px;">
              ${step.letter}
            </div>
            <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 6px;">${step.name}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${step.description}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Top HR Questions with Expandable Answers -->
    <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 16px;">Top HR & Behavioral Questions with Model Answers</h2>
    <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px;">
      ${questions.map((q, idx) => `
        <div class="notes-card" style="margin: 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <h3 style="font-size: 1.15rem; font-weight: 700;">#${idx + 1}. ${q.question}</h3>
            <span class="badge badge-primary">${q.category}</span>
          </div>

          <div style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 12px;">
            <strong>Recommended Framework:</strong> ${q.framework}
          </div>

          <div style="background: var(--bg-tertiary); padding: 14px 18px; border-radius: var(--radius-sm); border-left: 4px solid var(--primary); margin-bottom: 12px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--primary); margin-bottom: 4px;">High-Scoring Sample Answer:</div>
            <p style="font-size: 0.9rem; color: var(--text-primary); line-height: 1.6;">${q.sampleAnswer}</p>
          </div>

          <div class="tip-box">
            <strong>Interviewer's Secret Tip:</strong> ${q.tips}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Questions to Ask the Interviewer -->
    <div class="notes-card">
      <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 12px;">Questions You Should Ask the Interviewer</h3>
      <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 16px;">Demonstrate genuine curiosity and long-term alignment by asking these questions at the close of an interview round.</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
        ${(hr.questionsToAskInterviewer || []).map(qt => `
          <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 500;">
            💬 "${qt}"
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Interactive Quiz Arena
let quizTimerInterval = null;

function renderQuizSection() {
  if (!state.quiz) {
    return `
      <div style="text-align: center; max-width: 620px; margin: 40px auto; padding: 36px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🎯</div>
        <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 8px;">Interactive Placement Quiz Arena</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">Test your knowledge in real-time with countdown timers, immediate explanations, and persistent score tracking.</p>
        
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="startPracticeQuiz('Aptitude', 'Quantitative Aptitude')">
            Start Aptitude Quiz
          </button>
          <button class="btn btn-outline" onclick="startPracticeQuiz('Logical Reasoning', 'Logical Reasoning Test')">
            Start Logical Reasoning
          </button>
          <button class="btn btn-primary" style="background: var(--purple);" onclick="startPracticeQuiz('Technical', 'Core CS Subjects')">
            Start Technical CS Test
          </button>
        </div>
      </div>
    `;
  }

  const q = state.quiz;
  if (q.isFinished) {
    clearInterval(quizTimerInterval);
    const pct = Math.round((q.score / q.questions.length) * 100);
    return `
      <div class="quiz-container" style="text-align: center;">
        <div style="font-size: 3.5rem; margin-bottom: 12px;">${pct >= 70 ? '🎉' : '📚'}</div>
        <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 6px;">Quiz Completed!</h2>
        <p style="color: var(--text-muted); margin-bottom: 20px;">Category: ${q.category} • ${q.topic}</p>

        <div style="font-size: 2.5rem; font-weight: 800; color: ${pct >= 70 ? 'var(--success)' : 'var(--warning)'}; margin-bottom: 8px;">
          ${q.score} / ${q.questions.length}
        </div>
        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 28px;">
          Score: ${pct}%
        </div>

        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="btn btn-outline" onclick="state.quiz = null; renderView();">Exit Quiz Arena</button>
          <button class="btn btn-primary" onclick="startPracticeQuiz('${q.category}', '${q.topic}')">Retake Quiz</button>
        </div>
      </div>
    `;
  }

  const currentQ = q.questions[q.currentIndex];
  return `
    <div class="quiz-container">
      <div class="quiz-header">
        <div>
          <span class="badge badge-primary">${q.category}</span>
          <span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 8px;">Question ${q.currentIndex + 1} of ${q.questions.length}</span>
        </div>
        <div class="quiz-timer">
          ${Icons.clock} <span id="quiz-timer-display">${q.timeLeft}s</span>
        </div>
      </div>

      <div class="question-text">${currentQ.question}</div>

      <div class="quiz-options">
        ${(currentQ.options || []).map((opt, idx) => {
          let classes = 'quiz-option-label';
          if (q.selectedAnswer !== null) {
            if (idx === currentQ.correct) classes += ' correct';
            else if (idx === q.selectedAnswer) classes += ' incorrect';
          }
          return `
            <div class="${classes}" onclick="handleQuizAnswer(${idx})">
              <span style="font-weight: 700; width: 24px;">${String.fromCharCode(65 + idx)}.</span>
              <span>${opt}</span>
            </div>
          `;
        }).join('')}
      </div>

      ${q.selectedAnswer !== null ? `
        <div style="padding: 14px; background: var(--bg-tertiary); border-radius: var(--radius-sm); margin-bottom: 20px; font-size: 0.88rem;">
          <strong>Explanation:</strong> ${currentQ.explanation}
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" onclick="nextQuizQuestion()">
            ${q.currentIndex + 1 === q.questions.length ? 'View Final Results' : 'Next Question &rarr;'}
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function startPracticeQuiz(category, topic) {
  let questions = [];
  if (category === 'Aptitude' || category === 'Quantitative Aptitude') {
    questions = state.prep.aptitude?.questions || [];
  } else if (category === 'Logical Reasoning') {
    questions = state.prep.logical?.questions || [];
  } else if (category === 'Verbal Ability & English') {
    questions = state.prep.verbal?.questions || [];
  } else {
    const subjects = state.prep.technical?.subjects || [];
    subjects.forEach(s => { questions = questions.concat(s.questions || []); });
  }

  if (questions.length === 0) {
    showToast('No questions found for this topic', 'error');
    return;
  }

  clearInterval(quizTimerInterval);

  state.quiz = {
    category,
    topic,
    questions,
    currentIndex: 0,
    selectedAnswer: null,
    score: 0,
    isFinished: false,
    timeLeft: 45
  };

  // Start real countdown timer
  quizTimerInterval = setInterval(() => {
    if (!state.quiz || state.quiz.isFinished) {
      clearInterval(quizTimerInterval);
      return;
    }
    if (state.quiz.selectedAnswer === null) {
      state.quiz.timeLeft -= 1;
      const el = document.getElementById('quiz-timer-display');
      if (el) el.textContent = `${state.quiz.timeLeft}s`;

      if (state.quiz.timeLeft <= 0) {
        handleQuizAnswer(-1); // Time out
      }
    }
  }, 1000);

  state.prepSubTab = 'quiz';
  renderView();
}

function handleQuizAnswer(index) {
  if (!state.quiz || state.quiz.selectedAnswer !== null) return;
  state.quiz.selectedAnswer = index;
  const currentQ = state.quiz.questions[state.quiz.currentIndex];

  if (index === currentQ.correct) {
    state.quiz.score += 1;
    showToast('Correct answer! +1 point');
  } else if (index === -1) {
    showToast('Time expired for this question!', 'error');
  } else {
    showToast('Incorrect answer', 'error');
  }
  renderView();
}

async function nextQuizQuestion() {
  if (!state.quiz) return;
  if (state.quiz.currentIndex + 1 < state.quiz.questions.length) {
    state.quiz.currentIndex += 1;
    state.quiz.selectedAnswer = null;
    state.quiz.timeLeft = 45;
    renderView();
  } else {
    state.quiz.isFinished = true;
    clearInterval(quizTimerInterval);

    const record = {
      id: `quiz-${Date.now().toString(36)}`,
      category: state.quiz.category,
      topic: state.quiz.topic,
      score: state.quiz.score,
      total: state.quiz.questions.length,
      percentage: Math.round((state.quiz.score / state.quiz.questions.length) * 100),
      taken_at: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    state.quizHistory.unshift(record);
    localStorage.setItem('cf_quiz_history', JSON.stringify(state.quizHistory));

    try {
      await api('/api/quiz/submit', 'POST', record);
    } catch (err) {
      console.warn('Backend sync deferred:', err);
    }

    renderView();
  }
}

// ==========================================
// 5. COMPANIES HIRING PROCESS VIEW
// ==========================================
function renderCompanies(root) {
  const filtered = state.companies.filter(c => {
    if (state.companyFilters.q && !c.name.toLowerCase().includes(state.companyFilters.q.toLowerCase())) return false;
    if (state.companyFilters.category !== 'all' && c.category.toLowerCase() !== state.companyFilters.category) return false;
    return true;
  });

  root.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 4px;">Top Tech Companies Hiring Process & Patterns</h1>
      <p style="color: var(--text-muted); font-size: 0.95rem;">Official exam patterns, academic eligibility rules, selection workflows, and insider interview tips for Tier-1 and mass recruiters.</p>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="search-input-wrap">
        ${Icons.search}
        <input type="text" id="company-search-input" class="search-input" placeholder="Search company (e.g. TCS, Wipro, Amazon, Google)..." value="${state.companyFilters.q}">
      </div>

      <div class="filter-tags">
        <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Category:</span>
        <button class="filter-pill ${state.companyFilters.category === 'all' ? 'active' : ''}" onclick="setCompanyCategory('all')">All Companies (${state.companies.length})</button>
        <button class="filter-pill ${state.companyFilters.category === 'product' ? 'active' : ''}" onclick="setCompanyCategory('product')">Product-Based</button>
        <button class="filter-pill ${state.companyFilters.category === 'service' ? 'active' : ''}" onclick="setCompanyCategory('service')">Service-Based</button>
      </div>
    </div>

    <!-- Company Cards Grid -->
    <div class="cards-grid">
      ${filtered.map(comp => `
        <div class="company-card" onclick="openCompanyModal('${comp.id}')">
          <div class="company-header">
            <h3 class="company-title">${comp.name}</h3>
            <span class="badge ${comp.category === 'Product' ? 'badge-primary' : 'badge-neutral'}">${comp.category}</span>
          </div>

          <div class="role-pill-list">
            ${comp.roles.map(r => `<span class="skill-tag" style="background: var(--primary-light); color: var(--primary);">${r}</span>`).join('')}
          </div>

          <div class="company-stats-strip">
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Assessment</div>
              <div style="font-weight: 600;">${comp.examPattern.platform}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Duration</div>
              <div style="font-weight: 600;">${comp.examPattern.totalDuration}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Cutoff</div>
              <div style="font-weight: 600;">${comp.eligibility.minMarks.split(' ')[0]}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Selection</div>
              <div style="font-weight: 600;">${comp.rounds.length} Rounds</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <span style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">View Syllabus & Pattern &rarr;</span>
            <span style="color: var(--text-muted);">${Icons.chevronRight}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const searchInput = document.getElementById('company-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.companyFilters.q = e.target.value;
      renderCompanies(root);
      const updated = document.getElementById('company-search-input');
      if (updated) { updated.focus(); updated.setSelectionRange(updated.value.length, updated.value.length); }
    });
  }
}

function setCompanyCategory(cat) { state.companyFilters.category = cat; renderView(); }

function openCompanyModal(companyId) {
  const comp = state.companies.find(c => c.id === companyId);
  if (!comp) return;

  document.getElementById('mcd-title').textContent = `${comp.name} - Hiring Process & Syllabus`;
  const body = document.getElementById('mcd-body');

  body.innerHTML = `
    <!-- Roles & Packages -->
    <div style="margin-bottom: 20px; padding: 14px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
      <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px;">CAREER ROLES & SAMPLE PACKAGES:</div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${comp.roles.map(r => `<span class="badge badge-primary" style="padding: 6px 12px; font-size: 0.85rem;">${r}</span>`).join('')}
      </div>
    </div>

    <!-- Eligibility Criteria -->
    <h4 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 10px;">Academic Eligibility Criteria</h4>
    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 24px;">
      <div style="margin-bottom: 8px;"><strong>Degrees:</strong> ${(comp.eligibility.degrees || []).join(', ')}</div>
      <div style="margin-bottom: 8px;"><strong>Eligible Branches:</strong> ${(comp.eligibility.branches || []).join(', ')}</div>
      <div style="margin-bottom: 8px;"><strong>Cutoff Marks:</strong> ${comp.eligibility.minMarks}</div>
      <div style="margin-bottom: 8px;"><strong>Backlogs Policy:</strong> ${comp.eligibility.backlogs}</div>
      <div><strong>Education Gap:</strong> ${comp.eligibility.gap}</div>
    </div>

    <!-- Exam Pattern Breakdown -->
    <h4 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 10px;">Online Exam Pattern (${comp.examPattern.platform})</h4>
    <div style="margin-bottom: 24px; overflow-x: auto;">
      <table class="dsa-table">
        <thead>
          <tr>
            <th>Section</th>
            <th>Questions</th>
            <th>Duration</th>
            <th>Topics Covered</th>
          </tr>
        </thead>
        <tbody>
          ${comp.examPattern.sections.map(s => `
            <tr>
              <td style="font-weight: 700;">${s.name}</td>
              <td>${s.questions}</td>
              <td>${s.duration}</td>
              <td style="font-size: 0.85rem; color: var(--text-secondary);">${s.topics}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Rounds Selection Workflow -->
    <h4 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 10px;">Selection Workflow & Rounds</h4>
    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
      ${comp.rounds.map((r, i) => `
        <div style="padding: 14px; background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div style="font-weight: 700; font-size: 0.95rem;">${r.round}</div>
            <span class="badge badge-neutral">${r.type}</span>
          </div>
          <div style="font-size: 0.88rem; color: var(--text-secondary);">${r.description}</div>
        </div>
      `).join('')}
    </div>

    <!-- Proven Tips -->
    <h4 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 10px;">Insider Tips & Interview Experiences</h4>
    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
      ${comp.tips.map(t => `
        <div class="tip-box" style="margin: 0;">
          💡 ${t}
        </div>
      `).join('')}
    </div>
  `;

  openModal('modal-company-detail');
}

// ==========================================
// 6. DEDICATED TOPIC-WISE DSA PREPARATION SHEET (12 TOPICS)
// ==========================================
const DSA_TOPICS_ORDER = [
  'Arrays',
  'Strings',
  'Linked Lists',
  'Stacks and Queues',
  'Searching and Sorting',
  'Binary Search',
  'Recursion and Backtracking',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Greedy Algorithms',
  'Hashing'
];

function renderDSA(root) {
  const solvedCount = state.dsa.filter(p => p.is_solved).length;
  const totalCount = state.dsa.length;
  const pct = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  // Filter problems
  const filtered = state.dsa.filter(p => {
    if (state.dsaFilters.topic !== 'all' && p.topic !== state.dsaFilters.topic) return false;
    if (state.dsaFilters.difficulty !== 'all' && p.difficulty.toLowerCase() !== state.dsaFilters.difficulty) return false;
    if (state.dsaFilters.status === 'solved' && !p.is_solved) return false;
    if (state.dsaFilters.status === 'unsolved' && p.is_solved) return false;
    if (state.dsaFilters.status === 'starred' && !p.is_starred) return false;
    if (state.dsaFilters.search) {
      const q = state.dsaFilters.search.toLowerCase();
      const match = `${p.title} ${p.topic} ${(p.companies || []).join(' ')} ${p.pattern || ''}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  root.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
      <div>
        <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 4px;">Dedicated Topic-Wise DSA Sheets</h1>
        <p style="color: var(--text-muted); font-size: 0.95rem;">12 Core Algorithmic Tracks covering SDE placements with tested solutions in C++, Java, and Python.</p>
      </div>

      <div style="display: flex; align-items: center; gap: 14px; background: var(--bg-card); padding: 12px 18px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Overall Progress</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">${solvedCount} / ${totalCount} (${pct}%)</div>
        </div>
        <div class="progress-track" style="width: 120px;">
          <div class="progress-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="search-input-wrap">
        ${Icons.search}
        <input type="text" id="dsa-search-input" class="search-input" placeholder="Search problem, company tag, or algorithmic pattern..." value="${state.dsaFilters.search}">
      </div>

      <div class="filter-tags">
        <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Difficulty:</span>
        <button class="filter-pill ${state.dsaFilters.difficulty === 'all' ? 'active' : ''}" onclick="setDsaDifficulty('all')">All</button>
        <button class="filter-pill ${state.dsaFilters.difficulty === 'easy' ? 'active' : ''}" onclick="setDsaDifficulty('easy')">Easy</button>
        <button class="filter-pill ${state.dsaFilters.difficulty === 'medium' ? 'active' : ''}" onclick="setDsaDifficulty('medium')">Medium</button>
        <button class="filter-pill ${state.dsaFilters.difficulty === 'hard' ? 'active' : ''}" onclick="setDsaDifficulty('hard')">Hard</button>
      </div>

      <div class="filter-tags">
        <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Status:</span>
        <button class="filter-pill ${state.dsaFilters.status === 'all' ? 'active' : ''}" onclick="setDsaStatusFilter('all')">All</button>
        <button class="filter-pill ${state.dsaFilters.status === 'unsolved' ? 'active' : ''}" onclick="setDsaStatusFilter('unsolved')">Unsolved</button>
        <button class="filter-pill ${state.dsaFilters.status === 'solved' ? 'active' : ''}" onclick="setDsaStatusFilter('solved')">Solved</button>
        <button class="filter-pill ${state.dsaFilters.status === 'starred' ? 'active' : ''}" onclick="setDsaStatusFilter('starred')">Starred ★</button>
      </div>
    </div>

    <!-- 12 Topic Pills Bar -->
    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 20px;">
      <button class="filter-pill ${state.dsaFilters.topic === 'all' ? 'active' : ''}" onclick="setDsaTopic('all')">All 12 Topics</button>
      ${DSA_TOPICS_ORDER.map(t => {
        const tSolved = state.dsa.filter(p => p.topic === t && p.is_solved).length;
        const tTotal = state.dsa.filter(p => p.topic === t).length;
        return `
          <button class="filter-pill ${state.dsaFilters.topic === t ? 'active' : ''}" onclick="setDsaTopic('${t}')">
            ${t} (${tSolved}/${tTotal})
          </button>
        `;
      }).join('')}
    </div>

    <!-- Problems Table Container -->
    <div class="notes-card" style="padding: 0; overflow: hidden;">
      <table class="dsa-table">
        <thead>
          <tr>
            <th style="width: 44px; text-align: center;">Done</th>
            <th style="width: 40px; text-align: center;">Star</th>
            <th>Problem Title</th>
            <th>Topic & Pattern</th>
            <th>Difficulty</th>
            <th>Top Companies</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.length === 0 ? `
            <tr>
              <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                No problems match your selected filter criteria.
              </td>
            </tr>
          ` : filtered.map(p => `
            <tr class="${p.is_solved ? 'solved-row' : ''}">
              <td style="text-align: center;">
                <div class="custom-checkbox ${p.is_solved ? 'checked' : ''}" onclick="toggleDsaSolved('${p.id}', ${!p.is_solved})">
                  ${p.is_solved ? Icons.check : ''}
                </div>
              </td>
              <td style="text-align: center;">
                <button class="star-btn ${p.is_starred ? 'starred' : ''}" onclick="toggleDsaStarred('${p.id}', ${!p.is_starred})">
                  ${p.is_starred ? Icons.starFilled : Icons.star}
                </button>
              </td>
              <td>
                <div style="font-weight: 700; cursor: pointer; color: var(--text-primary);" onclick="openProblemModal('${p.id}')">
                  ${p.title}
                </div>
                ${p.notes ? `<div style="font-size: 0.78rem; color: var(--primary); margin-top: 2px;">📝 Note: ${p.notes.slice(0, 45)}...</div>` : ''}
              </td>
              <td>
                <div style="font-weight: 500;">${p.topic}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${p.pattern || 'Pattern'}</div>
              </td>
              <td>
                <span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
              </td>
              <td>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                  ${(p.companies || []).slice(0, 3).map(c => `<span class="skill-tag" style="font-size: 0.72rem;">${c}</span>`).join('')}
                </div>
              </td>
              <td style="text-align: right;">
                <button class="btn btn-primary btn-sm" onclick="openProblemModal('${p.id}')">
                  ${Icons.code} Solve
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const searchInput = document.getElementById('dsa-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.dsaFilters.search = e.target.value;
      renderDSA(root);
      const updated = document.getElementById('dsa-search-input');
      if (updated) { updated.focus(); updated.setSelectionRange(updated.value.length, updated.value.length); }
    });
  }
}

function setDsaTopic(topic) { state.dsaFilters.topic = topic; renderView(); }
function setDsaDifficulty(diff) { state.dsaFilters.difficulty = diff; renderView(); }
function setDsaStatusFilter(status) { state.dsaFilters.status = status; renderView(); }

// Helper to persist DSA progress to localStorage
function persistLocalDsaProgress() {
  const map = {};
  state.dsa.forEach(p => {
    map[p.id] = { is_solved: p.is_solved, is_starred: p.is_starred, notes: p.notes };
  });
  localStorage.setItem('cf_dsa_prog', JSON.stringify(map));
}

// Toggle Solved
async function toggleDsaSolved(problemId, status) {
  const item = state.dsa.find(p => p.id === problemId);
  if (item) item.is_solved = status;
  persistLocalDsaProgress();
  showToast(status ? 'Problem marked as solved!' : 'Problem marked as unsolved');
  renderView();

  try {
    await api('/api/dsa/status', 'POST', { problem_id: problemId, is_solved: status });
  } catch (e) {
    console.warn('Backend sync deferred:', e);
  }
}

// Toggle Starred
async function toggleDsaStarred(problemId, starred) {
  const item = state.dsa.find(p => p.id === problemId);
  if (item) item.is_starred = starred;
  persistLocalDsaProgress();
  showToast(starred ? 'Problem added to starred list!' : 'Problem unstarred');
  renderView();

  try {
    await api('/api/dsa/status', 'POST', { problem_id: problemId, is_starred: starred });
  } catch (e) {
    console.warn('Backend sync deferred:', e);
  }
}

// Open Problem Detail Modal (with C++, Java, Python code & personal notes)
function openProblemModal(problemId) {
  const p = state.dsa.find(item => item.id === problemId);
  if (!p) return;
  state.activeProblemId = problemId;

  document.getElementById('mdd-title').textContent = p.title;
  const diffBadge = document.getElementById('mdd-diff');
  diffBadge.textContent = p.difficulty;
  diffBadge.className = `badge badge-${p.difficulty.toLowerCase()}`;

  const body = document.getElementById('mdd-body');
  body.innerHTML = `
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
      <span class="badge badge-primary">${p.topic}</span>
      <span class="badge badge-neutral">Pattern: ${p.pattern || 'Standard'}</span>
      ${(p.companies || []).map(c => `<span class="skill-tag">${c}</span>`).join('')}
    </div>

    <h4 style="font-weight: 700; margin-bottom: 6px;">Problem Statement</h4>
    <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">${p.description}</p>

    <h4 style="font-weight: 700; margin-bottom: 6px;">Example & Expected Output</h4>
    <div style="background: var(--bg-tertiary); padding: 12px; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 16px; white-space: pre-wrap;">${p.example}</div>

    <div class="tip-box" style="margin-bottom: 16px;">
      <strong>Actionable Hint:</strong> ${(p.hints || []).join(' ')}
    </div>

    <h4 style="font-weight: 700; margin-bottom: 6px;">Optimal Solution Approach</h4>
    <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin-bottom: 10px;">${p.approach}</p>
    <div style="font-size: 0.85rem; font-weight: 600; color: #059669; margin-bottom: 16px;">
      Complexity: ${p.complexity}
    </div>

    <!-- Code Viewer with C++, Java, and Python tabs -->
    <div class="code-container">
      <div class="code-header">
        <div class="code-tabs">
          <button class="code-tab-btn active" id="btn-lang-cpp" onclick="switchProblemLang('cpp')">C++</button>
          <button class="code-tab-btn" id="btn-lang-java" onclick="switchProblemLang('java')">Java</button>
          <button class="code-tab-btn" id="btn-lang-python" onclick="switchProblemLang('python')">Python</button>
        </div>
        <button class="btn btn-ghost btn-sm" style="color: #fff;" onclick="copyProblemCode()">
          ${Icons.copy} Copy Code
        </button>
      </div>
      <div class="code-block" id="p-code-view">${escapeHtml(p.code.cpp)}</div>
    </div>

    <!-- Personal Notes Section -->
    <div style="margin-top: 24px;">
      <h4 style="font-weight: 700; margin-bottom: 6px;">My Personal Notes & Insights</h4>
      <textarea id="p-notes-input" class="form-control" placeholder="Write personal reflections, edge cases to remember, or key tricks...">${p.notes || ''}</textarea>
      <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
        <button class="btn btn-outline btn-sm" onclick="saveProblemNotes('${p.id}')">Save Notes</button>
      </div>
    </div>
  `;

  const btnToggle = document.getElementById('mdd-btn-toggle-solved');
  btnToggle.textContent = p.is_solved ? 'Mark as Unsolved' : 'Mark as Solved';
  btnToggle.className = p.is_solved ? 'btn btn-outline' : 'btn btn-primary';
  btnToggle.onclick = () => {
    toggleDsaSolved(p.id, !p.is_solved);
    closeModal('modal-dsa-detail');
  };

  openModal('modal-dsa-detail');
}

function switchProblemLang(lang) {
  const p = state.dsa.find(item => item.id === state.activeProblemId);
  if (!p) return;

  ['cpp', 'java', 'python'].forEach(l => {
    const btn = document.getElementById(`btn-lang-${l}`);
    if (btn) btn.className = l === lang ? 'code-tab-btn active' : 'code-tab-btn';
  });

  const codeView = document.getElementById('p-code-view');
  if (codeView && p.code[lang]) {
    codeView.textContent = p.code[lang];
  }
}

function copyProblemCode() {
  const codeView = document.getElementById('p-code-view');
  if (codeView) {
    navigator.clipboard.writeText(codeView.textContent);
    showToast('Code copied to clipboard!');
  }
}

async function saveProblemNotes(problemId) {
  const notes = document.getElementById('p-notes-input').value;
  const item = state.dsa.find(p => p.id === problemId);
  if (item) item.notes = notes;
  persistLocalDsaProgress();
  showToast('Notes saved successfully!');
  renderView();

  try {
    await api('/api/dsa/status', 'POST', { problem_id: problemId, notes });
  } catch (e) {
    console.warn('Backend sync deferred:', e);
  }
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ----------------------------------------------------
// FORM EVENT LISTENERS
// ----------------------------------------------------
function initFormListeners() {
  // Apply Job Form
  const formApply = document.getElementById('form-apply-job');
  if (formApply) {
    formApply.addEventListener('submit', async (e) => {
      e.preventDefault();
      const jobId = document.getElementById('maj-job-id').value;
      const job = state.jobs.find(j => j.id === jobId);

      const payload = {
        id: `app-${Date.now().toString(36)}`,
        job_id: jobId,
        job_title: job ? job.title : 'Software Role',
        company: job ? job.company : 'Company',
        candidate_name: document.getElementById('maj-name').value,
        email: document.getElementById('maj-email').value,
        phone: document.getElementById('maj-phone').value,
        experience: document.getElementById('maj-experience').value,
        resume_name: document.getElementById('maj-resume').value,
        cover_letter: document.getElementById('maj-cover').value,
        status: 'Applied',
        applied_at: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

      try {
        await api(`/api/jobs/${jobId}/apply`, 'POST', payload);
      } catch (err) {
        console.warn('Backend sync deferred:', err);
      }

      state.applications.unshift(payload);
      localStorage.setItem('cf_apps', JSON.stringify(state.applications));
      closeModal('modal-apply-job');
      showToast('Application successfully submitted!');
      renderView();
    });
  }

  // Post Job Form
  const formPost = document.getElementById('form-post-job');
  if (formPost) {
    formPost.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newJob = {
        id: `custom-job-${Date.now().toString(36)}`,
        title: document.getElementById('mpj-title').value,
        company: document.getElementById('mpj-company').value,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.svg',
        location: document.getElementById('mpj-location').value,
        salary: document.getElementById('mpj-salary').value,
        category: document.getElementById('mpj-category').value,
        type: document.getElementById('mpj-type').value,
        experience: 'Fresher / 0-2 Years',
        skills: document.getElementById('mpj-skills').value.split(',').map(s => s.trim()).filter(Boolean),
        description: document.getElementById('mpj-desc').value,
        requirements: document.getElementById('mpj-reqs').value.split('\n').filter(Boolean),
        responsibilities: ['Architect robust software services', 'Collaborate with cross-functional teams'],
        prepTags: ['Technical', 'DSA', 'HR'],
        posted: 'Just now',
        openings: 5
      };

      try {
        await api('/api/jobs', 'POST', newJob);
      } catch (err) {
        console.warn('Backend sync deferred:', err);
      }

      state.jobs.unshift(newJob);
      localStorage.setItem('cf_jobs', JSON.stringify(state.jobs));
      closeModal('modal-post-job');
      showToast('Job published successfully!');
      document.getElementById('form-post-job').reset();
      renderView();
    });
  }

  // Login Form
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await api('/api/auth/login', 'POST', { email, password });
        if (res && res.user) {
          state.user = res.user;
          localStorage.setItem('cf_user', JSON.stringify(state.user));
          updateUserHeader();
          closeModal('modal-auth');
          showToast(`Welcome back, ${state.user.name}!`);
          renderView();
          return;
        }
      } catch (err) {
        console.warn('API login failed, logging in locally:', err);
      }

      // Local fallback
      state.user = {
        id: 'user-1',
        name: email.split('@')[0],
        email: email,
        phone: '+91 98765 43210',
        college: 'Engineering Institute',
        graduation_year: '2026 Batch',
        target_role: 'Software Engineer',
        skills: 'Java, Python, DSA, SQL',
        bio: 'Passionate developer preparing for top tech drives.',
        resume_name: 'Resume.pdf'
      };
      localStorage.setItem('cf_user', JSON.stringify(state.user));
      updateUserHeader();
      closeModal('modal-auth');
      showToast(`Welcome, ${state.user.name}!`);
      renderView();
    });
  }

  // Register Form
  const formReg = document.getElementById('form-register');
  if (formReg) {
    formReg.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userData = {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        college: document.getElementById('reg-college').value,
        graduation_year: document.getElementById('reg-grad').value,
        target_role: document.getElementById('reg-role').value,
        phone: '',
        skills: 'Python, Java, DSA',
        bio: 'Aspiring software engineer.',
        resume_name: 'Resume.pdf'
      };

      try {
        const res = await api('/api/auth/register', 'POST', userData);
        if (res && res.user) {
          state.user = res.user;
          localStorage.setItem('cf_user', JSON.stringify(state.user));
          updateUserHeader();
          closeModal('modal-auth');
          showToast(`Account created! Welcome, ${state.user.name}`);
          renderView();
          return;
        }
      } catch (err) {
        console.warn('API register error, falling back locally:', err);
      }

      state.user = userData;
      localStorage.setItem('cf_user', JSON.stringify(state.user));
      updateUserHeader();
      closeModal('modal-auth');
      showToast(`Account created! Welcome, ${state.user.name}`);
      renderView();
    });
  }

  // Edit Profile Form
  const formProfile = document.getElementById('form-edit-profile');
  if (formProfile) {
    formProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.user) return;

      state.user.name = document.getElementById('prof-name').value;
      state.user.phone = document.getElementById('prof-phone').value;
      state.user.college = document.getElementById('prof-college').value;
      state.user.graduation_year = document.getElementById('prof-grad').value;
      state.user.target_role = document.getElementById('prof-role').value;
      state.user.skills = document.getElementById('prof-skills').value;
      state.user.resume_name = document.getElementById('prof-resume').value;
      state.user.bio = document.getElementById('prof-bio').value;

      localStorage.setItem('cf_user', JSON.stringify(state.user));
      updateUserHeader();
      closeModal('modal-profile');
      showToast('Profile updated successfully!');
      renderView();

      try {
        await api('/api/user/profile', 'PUT', state.user);
      } catch (err) {
        console.warn('Backend sync deferred:', err);
      }
    });
  }

  // Header user button listener
  const btnUserAuth = document.getElementById('btn-user-auth');
  if (btnUserAuth) {
    btnUserAuth.addEventListener('click', openAuthOrProfileModal);
  }

  // Header post job listener
  const btnPostJob = document.getElementById('btn-post-job');
  if (btnPostJob) {
    btnPostJob.addEventListener('click', () => openModal('modal-post-job'));
  }
}

// ==========================================
// INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavIcons();
  initFormListeners();
  loadInitialData();
  handleRouting();
});
