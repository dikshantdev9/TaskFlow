/* ============================================================
   api.js — session storage + REST client
   Load this BEFORE utils.js and any page script.
   ============================================================ */

/* ------------------------------------------------- API base */
/**
 * Same-origin by default (Express serves this folder).
 * If you host the frontend separately, set window.TASKFLOW_API before
 * this script runs, e.g. <script>window.TASKFLOW_API='http://localhost:5000/api'</script>
 */
const PROXY = 'http://localhost:5000';
const API_BASE = (
  window.TASKFLOW_API ||
  // Served by the same Express process locally; behind a preview proxy the
  // PROXY token is rewritten to the forwarded path at deploy time.
  (PROXY.startsWith('__') ? `${location.origin}/api` : `${PROXY}/api`)
).replace(/\/$/, '');

/* -------------------------------------------------- storage --
   Prefers localStorage. Falls back to window.name (which survives
   same-tab navigation) when storage is blocked, e.g. inside a
   sandboxed iframe preview.
-------------------------------------------------------------- */
const Store = (() => {
  const NS = 'taskflow';
  let usable = true;
  try {
    localStorage.setItem('__tf', '1');
    localStorage.removeItem('__tf');
  } catch (_) {
    usable = false;
  }

  const readFallback = () => {
    try {
      const raw = window.name || '';
      return raw.startsWith('{') ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  };

  const read = () => {
    if (!usable) return readFallback();
    try {
      return JSON.parse(localStorage.getItem(NS) || '{}');
    } catch (_) {
      return {};
    }
  };

  const write = (obj) => {
    const raw = JSON.stringify(obj);
    if (usable) {
      try {
        localStorage.setItem(NS, raw);
        return;
      } catch (_) {
        usable = false;
      }
    }
    window.name = raw;
  };

  return {
    get: (k) => read()[k],
    set(k, v) {
      const s = read();
      s[k] = v;
      write(s);
    },
    remove(k) {
      const s = read();
      delete s[k];
      write(s);
    },
    clear() {
      write({});
    },
    token: () => read().token || null,
    session(token, user) {
      write({ ...read(), token, user });
    },
  };
})();

/* ---------------------------------------------------- client */
const API = {
  async request(path, { method = 'GET', body, raw = false } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = Store.token();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(API_BASE + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (_) {
      throw new Error('Cannot reach the server. Is the backend running?');
    }

    if (res.status === 401 && !path.startsWith('/auth/')) {
      Store.clear();
      if (!location.pathname.endsWith('index.html') && !location.pathname.endsWith('signup.html')) {
        location.href = 'index.html';
      }
      throw new Error('Your session expired. Please sign in again.');
    }

    if (raw) return res;

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      /* empty body */
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.message || `Request failed (${res.status})`);
    }
    return data;
  },

  get: (p) => API.request(p),
  post: (p, body) => API.request(p, { method: 'POST', body }),
  put: (p, body) => API.request(p, { method: 'PUT', body }),
  patch: (p, body) => API.request(p, { method: 'PATCH', body }),
  del: (p) => API.request(p, { method: 'DELETE' }),

  /* ---- auth ---- */
  async signup(payload) {
    const d = await API.post('/auth/signup', payload);
    Store.session(d.token, d.user);
    return d;
  },
  async login(payload) {
    const d = await API.post('/auth/login', payload);
    Store.session(d.token, d.user);
    return d;
  },
  async logout() {
    try {
      await API.post('/auth/logout', {});
    } catch (_) {
      /* stateless — client-side clear is enough */
    }
    Store.clear();
  },

  /* ---- tasks ---- */
  tasks: (query = '') => API.get(`/tasks${query ? `?${query}` : ''}`),
  task: (id) => API.get(`/tasks/${id}`),
  createTask: (b) => API.post('/tasks', b),
  updateTask: (id, b) => API.put(`/tasks/${id}`, b),
  pinTask: (id) => API.patch(`/tasks/${id}/pin`, {}),
  deleteTask: (id) => API.del(`/tasks/${id}`),
  restoreTask: (id) => API.patch(`/tasks/${id}/restore`, {}),
  destroyTask: (id) => API.del(`/tasks/${id}/permanent`),
  emptyTrash: () => API.del('/tasks/trash/empty'),

  /* ---- subtasks ---- */
  createSubtask: (b) => API.post('/subtasks', b),
  createSubtasksBulk: (b) => API.post('/subtasks/bulk', b),
  updateSubtask: (id, b) => API.put(`/subtasks/${id}`, b),
  toggleSubtask: (id, completed) => API.patch(`/subtasks/${id}/toggle`, { completed }),
  deleteSubtask: (id) => API.del(`/subtasks/${id}`),

  /* ---- meta & stats ---- */
  stats: () => API.get('/tasks/stats/overview'),
  analytics: (range) => API.get(`/tasks/stats/analytics?range=${range || 30}`),
  calendar: (y, m) => API.get(`/tasks/stats/calendar?year=${y}&month=${m}`),
  categories: () => API.get('/tasks/meta/categories'),
  createCategory: (b) => API.post('/tasks/meta/categories', b),
  deleteCategory: (id) => API.del(`/tasks/meta/categories/${id}`),
  tags: () => API.get('/tasks/meta/tags'),

  /* ---- user ---- */
  profile: () => API.get('/users/profile'),
  updateProfile: (b) => API.put('/users/profile', b),
  changePassword: (b) => API.put('/users/password', b),
  updateSettings: (b) => API.put('/users/settings', b),
  exportData: () => API.get('/users/export'),
  deleteAccount: () => API.del('/users/account'),
};
