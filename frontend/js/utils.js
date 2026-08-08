/* ============================================================
   utils.js — icons, theme, dates, toasts, modals, app shell
   Loaded on every page before api.js and the page script.
   ============================================================ */

/* ----------------------------------------------------- icons */
const ICONS = {
  logo: '<path d="M4 7h9M4 12h13M4 17h7"/><path d="M15.5 18.5l2 2 4-4.5"/>',
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  tasks: '<path d="M3 6l2 2 3-3"/><path d="M3 14l2 2 3-3"/><path d="M12 7h9M12 15h9"/>',
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  analytics: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  completed: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>',
  trash: '<path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"/><path d="M10 11v6M14 11v6"/>',
  folder: '<path d="M3 7.5A2 2 0 015 5.5h4l2 2.5h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
  flame: '<path d="M12 2.5s5.5 4.5 5.5 10a5.5 5.5 0 11-11 0c0-2 1-3.6 2-5 .3 1.2 1.2 2 2.2 2 1.6 0 2.3-1.6 1.8-3.4-.3-1.3-.5-2.6-.5-3.6z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
  pin: '<path d="M9 3h6l-.7 5.4 3 3.1-1 1.6H8.7l-1-1.6 3-3.1z"/><path d="M12 13.1V21"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7.5 18.5 3 20l1.5-4.5z"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
  chevronRight: '<path d="M9 18l6-6-6-6"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  moon: '<path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 1.5v2.2M12 20.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M1.5 12h2.2M20.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>',
  eye: '<path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M10.6 5.2A9.8 9.8 0 0112 5c6.2 0 10 7 10 7a17.6 17.6 0 01-3.2 4.1M6.5 6.6A17.5 17.5 0 002 12s3.8 7 10 7a9.7 9.7 0 004.6-1.1"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/><path d="M2 2l20 20"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.2v.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.7v.1"/>',
  tag: '<path d="M20.6 13.2l-7.4 7.4a2 2 0 01-2.8 0l-7-7A2 2 0 013 12.2V5a2 2 0 012-2h7.2a2 2 0 011.4.6l7 7a2 2 0 010 2.6z"/><path d="M7.5 7.5v.1"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 016.5 2H20v17H6.5A2.5 2.5 0 004 21.5z"/><path d="M4 19.5h16"/>',
  briefcase: '<rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M8.5 7V5a2 2 0 012-2h3a2 2 0 012 2v2"/>',
  heart: '<path d="M20.4 5.6a5 5 0 00-7.1 0L12 6.9l-1.3-1.3a5 5 0 10-7.1 7.1L12 21l8.4-8.3a5 5 0 000-7.1z"/>',
  activity: '<path d="M22 12h-4l-3 8-6-16-3 8H2"/>',
  restore: '<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/>',
  download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
  lock: '<rect x="4" y="10.5" width="16" height="11" rx="2.5"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M3 7l9 6 9-6"/>',
  arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  trending: '<path d="M22 7l-8.5 8.5-4-4L2 19"/><path d="M16 7h6v6"/>',
  circle: '<circle cx="12" cy="12" r="9" stroke-dasharray="4 3.5"/>',
  layers: '<path d="M12 2.5L3 7l9 4.5L21 7z"/><path d="M3 12l9 4.5L21 12M3 17l9 4.5L21 17"/>',
  more: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
};

/** Returns an inline SVG string for the given icon name. */
function icon(name, size) {
  const d = ICONS[name] || ICONS.circle;
  const s = size || 24;
  return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

/* ----------------------------------------------------- theme */
const Theme = {
  key: 'taskflow_theme',
  get() {
    return Store.get('theme') || 'system';
  },
  resolve(pref) {
    if (pref === 'light' || pref === 'dark') return pref;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  apply(pref) {
    const mode = Theme.resolve(pref || Theme.get());
    document.documentElement.setAttribute('data-theme', mode);
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.innerHTML = icon(mode === 'dark' ? 'sun' : 'moon', 18);
      btn.setAttribute('aria-label', `Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`);
    });
    return mode;
  },
  set(pref) {
    Store.set('theme', pref);
    return Theme.apply(pref);
  },
  toggle() {
    const current = Theme.resolve(Theme.get());
    return Theme.set(current === 'dark' ? 'light' : 'dark');
  },
};

/* ----------------------------------------------------- dates */
const DAY_MS = 86400000;

const dateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

const todayKey = () => dateKey(new Date());

function fmtDate(d, opts) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** "Today", "Tomorrow", "3 days ago", "in 5 days" */
function relDate(d) {
  if (!d) return '';
  const a = new Date(dateKey(d)).getTime();
  const b = new Date(todayKey()).getTime();
  const n = Math.round((a - b) / DAY_MS);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${Math.abs(n)} days ago`;
  if (n < 7) return `in ${n} days`;
  if (n < 30) return `in ${Math.round(n / 7)} week${n >= 14 ? 's' : ''}`;
  return `in ${Math.round(n / 30)} month${n >= 60 ? 's' : ''}`;
}

const isOverdue = (d) => !!d && new Date(dateKey(d)).getTime() < new Date(todayKey()).getTime();
const isToday = (d) => !!d && dateKey(d) === todayKey();

function greetingText() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

/* -------------------------------------------------- helpers */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

const debounce = (fn, ms) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms || 280);
  };
};

const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

const priorityBadge = (p) => `<span class="badge badge-dot p-${p}">${PRIORITY_LABEL[p] || p}</span>`;

/* ----------------------------------------------------- toast */
function toast(message, type) {
  let stack = $('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = `toast ${type || ''}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `${icon(type === 'error' ? 'alert' : type === 'warn' ? 'info' : 'completed', 18)}<span>${esc(message)}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 220);
  }, 3200);
}

/* ----------------------------------------------------- modal */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  const first = m.querySelector('input:not([type=hidden]), textarea, select');
  if (first) setTimeout(() => first.focus(), 90);
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
}
function wireModals() {
  $$('.modal-backdrop').forEach((m) => {
    m.addEventListener('click', (e) => {
      if (e.target === m) closeModal(m.id);
    });
  });
  $$('[data-close-modal]').forEach((b) =>
    b.addEventListener('click', () => closeModal(b.getAttribute('data-close-modal')))
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.modal-backdrop.open').forEach((m) => closeModal(m.id));
  });
}

/** Promise-based confirm dialog. */
function confirmDialog({ title, body, confirmText = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop open';
    wrap.innerHTML = `
      <div class="modal modal-sm" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>${esc(title)}</h2></div>
        <div class="modal-body"><p class="text-sm muted">${esc(body)}</p></div>
        <div class="modal-foot">
          <button class="btn btn-secondary" data-no>Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${esc(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const done = (v) => {
      wrap.remove();
      resolve(v);
    };
    wrap.querySelector('[data-no]').onclick = () => done(false);
    wrap.querySelector('[data-yes]').onclick = () => done(true);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) done(false);
    });
  });
}

/* -------------------------------------------------- app shell */
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: 'dashboard.html' },
  { key: 'tasks', label: 'My Tasks', icon: 'tasks', href: 'tasks.html?view=all' },
  { key: 'today', label: 'Today', icon: 'today', href: 'tasks.html?view=today' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar', href: 'calendar.html' },
  { key: 'analytics', label: 'Analytics', icon: 'analytics', href: 'analytics.html' },
  { key: 'completed', label: 'Completed', icon: 'completed', href: 'tasks.html?view=completed' },
  { key: 'trash', label: 'Trash', icon: 'trash', href: 'tasks.html?view=trash' },
];

const NAV_BOTTOM = [
  { key: 'categories', label: 'Categories', icon: 'folder', href: 'tasks.html?view=categories' },
  { key: 'settings', label: 'Settings', icon: 'settings', href: 'settings.html' },
  { key: 'profile', label: 'Profile', icon: 'user', href: 'profile.html' },
];

const brandMark = (size) =>
  `<span class="brand-mark">${icon('logo', size || 26)}</span>`;

/**
 * Renders the sidebar + topbar into #app.
 * @param {object} cfg { active, title, subtitle, search, actions }
 */
function renderShell(cfg) {
  const user = Store.get('user') || {};
  const link = (n) =>
    `<a class="nav-link ${n.key === cfg.active ? 'active' : ''}" href="${n.href}">
       ${icon(n.icon, 18)}<span>${n.label}</span>
       <span class="nav-count hidden" data-count="${n.key}"></span>
     </a>`;

  const sidebar = `
    <aside class="sidebar" id="sidebar">
      <a class="brand" href="dashboard.html" aria-label="TaskFlow home">
        ${brandMark(26)}<span class="brand-name">TaskFlow</span>
      </a>
      <nav class="nav" aria-label="Main">
        <button class="btn btn-primary btn-block nav-add" id="navAddTask">${icon('plus', 17)} New Task</button>
        ${NAV_ITEMS.map(link).join('')}
        <div class="nav-section">Workspace</div>
        ${NAV_BOTTOM.map(link).join('')}
      </nav>
      <div class="sidebar-foot">
        <a class="user-chip" href="profile.html">
          <span class="avatar" style="background:${esc(user.avatarColor || '#0F7A52')}">${esc(initials(user.name))}</span>
          <span class="grow">
            <span class="name truncate">${esc(user.name || 'Account')}</span>
            <span class="email truncate">${esc(user.email || '')}</span>
          </span>
        </a>
        <button class="nav-link" id="logoutBtn" style="width:100%;margin-top:4px">${icon('logout', 18)}<span>Logout</span></button>
      </div>
    </aside>
    <div class="scrim" id="scrim"></div>`;

  const topbar = `
    <header class="topbar">
      <button class="icon-btn menu-toggle" id="menuToggle" aria-label="Open menu">${icon('layers', 18)}</button>
      <div class="grow" style="min-width:0">
        <h1 class="truncate">${esc(cfg.title || '')}</h1>
        ${cfg.subtitle ? `<div class="topbar-sub truncate">${esc(cfg.subtitle)}</div>` : ''}
      </div>
      ${
        cfg.search
          ? `<div class="search-box">${icon('search', 16)}<input type="search" id="globalSearch" placeholder="Search tasks…" aria-label="Search tasks"></div>`
          : ''
      }
      <div class="bell-wrap">
        <button class="icon-btn" id="bellBtn" aria-label="Notifications">${icon('bell', 18)}<span class="bell-dot hidden" id="bellDot"></span></button>
        <div class="popover" id="notifPop">
          <div class="popover-head">Notifications</div>
          <div id="notifList"></div>
        </div>
      </div>
      <button class="icon-btn" data-theme-toggle aria-label="Toggle theme"></button>
      ${cfg.actions || ''}
    </header>`;

  const app = document.getElementById('app');
  app.className = 'app';
  app.innerHTML = `${sidebar}<div class="main">${topbar}<main class="page" id="page"></main></div>`;

  Theme.apply();

  // mobile drawer
  const sb = $('#sidebar');
  const scrim = $('#scrim');
  const closeDrawer = () => {
    sb.classList.remove('open');
    scrim.classList.remove('show');
  };
  $('#menuToggle').onclick = () => {
    sb.classList.toggle('open');
    scrim.classList.toggle('show');
  };
  scrim.onclick = closeDrawer;

  $$('[data-theme-toggle]').forEach((b) => (b.onclick = () => Theme.toggle()));

  $('#logoutBtn').onclick = async () => {
    await API.logout();
    location.href = 'index.html';
  };

  $('#navAddTask').onclick = () => {
    if (typeof window.openTaskModal === 'function') window.openTaskModal();
    else location.href = 'tasks.html?view=all&new=1';
  };

  // notifications
  const bell = $('#bellBtn');
  const pop = $('#notifPop');
  bell.onclick = (e) => {
    e.stopPropagation();
    pop.classList.toggle('open');
  };
  document.addEventListener('click', () => pop.classList.remove('open'));
  pop.addEventListener('click', (e) => e.stopPropagation());
  loadNotifications();

  return $('#page');
}

async function loadNotifications() {
  try {
    const { notifications } = await API.get('/tasks/meta/reminders');
    const list = $('#notifList');
    const dot = $('#bellDot');
    if (!list) return;
    if (!notifications.length) {
      list.innerHTML = `<div class="notif"><span class="notif-dot" style="background:var(--text-faint)"></span><div>You're all caught up.<time>No reminders right now</time></div></div>`;
      return;
    }
    dot.classList.remove('hidden');
    list.innerHTML = notifications
      .slice(0, 12)
      .map(
        (n) => `<div class="notif ${n.kind === 'overdue' ? 'overdue' : ''}">
          <span class="notif-dot"></span>
          <div class="grow">${esc(n.message)}<time>${fmtDate(n.remindAt)}</time></div>
        </div>`
      )
      .join('');
  } catch (_) {
    /* notifications are non-critical */
  }
}

/** Guard: bounce to login when there's no session. */
async function requireAuth() {
  if (!Store.token()) {
    location.href = 'index.html';
    return null;
  }
  try {
    const { user } = await API.get('/auth/me');
    Store.set('user', user);
    if (user.settings && user.settings.theme) Theme.apply(user.settings.theme);
    return user;
  } catch (err) {
    Store.clear();
    location.href = 'index.html';
    return null;
  }
}

/* ----------------------------------------- tiny SVG chart kit */
const Charts = {
  /** Vertical bar chart from [{label, value}] */
  bars(data, opts = {}) {
    const max = Math.max(1, ...data.map((d) => d.value));
    return `<div class="bars">${data
      .map((d, i) => {
        const h = Math.round((d.value / max) * 100);
        return `<div class="bar-col" title="${esc(d.label)}: ${d.value}">
            <span class="bar-value">${d.value || ''}</span>
            <div class="bar-track">
              <div class="bar ${d.value ? '' : 'zero'}" style="height:${d.value ? Math.max(h, 6) : 4}%;animation-delay:${i * 45}ms"></div>
            </div>
            <span class="bar-label">${esc(d.label)}</span>
          </div>`;
      })
      .join('')}</div>${opts.caption ? `<p class="text-xs faint" style="padding:0 var(--space-5) var(--space-4)">${esc(opts.caption)}</p>` : ''}`;
  },

  /** Donut from [{label, value, color}] */
  donut(data, { size = 148, thickness = 18, centerValue = '', centerLabel = '' } = {}) {
    const total = data.reduce((n, d) => n + d.value, 0);
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const rings = data
      .filter((d) => d.value > 0)
      .map((d) => {
        const len = (d.value / (total || 1)) * c;
        const seg = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${thickness}" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${size / 2} ${size / 2})" stroke-linecap="butt"/>`;
        offset += len;
        return seg;
      })
      .join('');

    return `<div class="donut" style="width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}" role="img" aria-label="Distribution chart">
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${thickness}"/>
          ${rings}
        </svg>
        <div class="donut-center"><div class="n mono">${centerValue}</div><div class="l">${esc(centerLabel)}</div></div>
      </div>`;
  },

  /** Progress ring */
  ring(pct, { size = 108, thickness = 9, label = '' } = {}) {
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
    return `<div class="ring-wrap" style="width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}" role="img" aria-label="${pct}% complete">
          <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${thickness}"/>
          <circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${thickness}"
            stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
        </svg>
        <div class="ring-label"><div class="n">${pct}%</div><div class="s">${esc(label)}</div></div>
      </div>`;
  },

  /** GitHub-style activity heatmap from [{date, completed}] */
  heatmap(series) {
    const max = Math.max(1, ...series.map((s) => s.completed));
    // Pad the front so the first cell lands on the right weekday row (Sun = row 1).
    const lead = series.length ? new Date(series[0].date + 'T00:00:00').getDay() : 0;
    const pad = Array.from({ length: lead }, () => '<div class="heat-cell heat-pad"></div>').join('');
    return `<div class="heatmap">${pad}${series
      .map((s) => {
        const lvl = s.completed === 0 ? 0 : Math.min(4, Math.ceil((s.completed / max) * 4));
        return `<div class="heat-cell heat-${lvl}" title="${s.date}: ${s.completed} completed"></div>`;
      })
      .join('')}</div>`;
  },
};

/* -------------------------------------------------- empty state */
function emptyState(iconName, title, body, actionHTML) {
  return `<div class="empty">
      <div class="empty-icon">${icon(iconName, 26)}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(body)}</p>
      ${actionHTML || ''}
    </div>`;
}
