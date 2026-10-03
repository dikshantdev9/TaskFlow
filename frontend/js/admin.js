/* ============================================================
   admin.js — Standalone Backend Administration & Telemetry Portal
   With Complete Light / Dark Theme Support
   ============================================================ */
(async function () {
  const adminToken = localStorage.getItem('taskflow_admin_token') || Store.token();

  if (!adminToken) {
    location.href = 'admin-login.html';
    return;
  }

  // Ensure current store uses adminToken
  if (!Store.token() && adminToken) {
    Store.session(adminToken, JSON.parse(localStorage.getItem('taskflow_admin_user') || '{}'));
  }

  let adminUser = null;
  try {
    const res = await API.get('/admin/me');
    if (!res.success || res.admin.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    adminUser = res.admin;
  } catch (_) {
    localStorage.removeItem('taskflow_admin_token');
    localStorage.removeItem('taskflow_admin_user');
    Store.clear();
    location.href = 'admin-login.html';
    return;
  }

  const app = document.getElementById('app');
  app.className = 'app standalone-admin';
  app.style.display = 'block';
  app.style.minHeight = '100vh';

  const ICONS = {
    moon: '<path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 1.5v2.2M12 20.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M1.5 12h2.2M20.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>',
  };

  app.innerHTML = `
    <header class="topbar" style="max-width:1280px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3)">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </span>
        <div>
          <div style="font-weight:700;font-size:17px;color:var(--text-bright)">TaskFlow Admin Center</div>
          <div style="font-size:12px;color:var(--text-muted)">Secure Backend Database, Telemetry &amp; Plan Configuration</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px">
        <!-- Theme Toggle -->
        <button id="adminThemeToggle" class="icon-btn" style="width:36px;height:36px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-bright);cursor:pointer;display:flex;align-items:center;justify-content:center" title="Toggle Theme">
          <svg id="adminThemeIcon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${ICONS.sun}
          </svg>
        </button>

        <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:20px;font-size:12px;color:#10b981">
          <span style="width:7px;height:7px;border-radius:50%;background:#10b981"></span>
          ${esc(adminUser.email)}
        </span>
        
        <button id="adminLogoutBtn" class="btn btn-outline btn-sm" style="font-size:12px">
          Sign Out
        </button>
      </div>
    </header>

    <main style="max-width:1280px;margin:0 auto;padding:32px 24px">
      <!-- Stats Row -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:28px">
        <div class="card admin-card-theme" style="padding:20px">
          <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600;letter-spacing:0.05em">Total Users</div>
          <div id="statUsers" style="font-size:32px;font-weight:700;margin-top:8px;color:var(--text-bright)">-</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Registered accounts</div>
        </div>

        <div class="card admin-card-theme" style="padding:20px">
          <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600;letter-spacing:0.05em">Pro Subscribers</div>
          <div id="statPro" style="font-size:32px;font-weight:700;margin-top:8px;color:#10b981">-</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Active paying users</div>
        </div>

        <div class="card admin-card-theme" style="padding:20px">
          <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600;letter-spacing:0.05em">Pending Approvals</div>
          <div id="statPending" style="font-size:32px;font-weight:700;margin-top:8px;color:#f59e0b">-</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Razorpay / UTR requests</div>
        </div>

        <div class="card admin-card-theme" style="padding:20px">
          <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600;letter-spacing:0.05em">Total Logins</div>
          <div id="statLogins" style="font-size:32px;font-weight:700;margin-top:8px;color:#38bdf8">-</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Lifetime login sessions</div>
        </div>

        <div class="card admin-card-theme" style="padding:20px">
          <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600;letter-spacing:0.05em">Total Tasks</div>
          <div id="statTasks" style="font-size:32px;font-weight:700;margin-top:8px;color:#a855f7">-</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Tasks in database</div>
        </div>
      </div>

      <!-- Plan Pricing & Settings Section -->
      <section class="card admin-card-theme" style="padding:24px;margin-bottom:28px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:var(--text-bright);margin:0 0 4px 0;display:flex;align-items:center;gap:6px">
              ${icon('zap', 18)} Subscription Plans &amp; Pricing Configuration
            </h2>
            <div style="font-size:13px;color:var(--text-muted)">
              Edit prices, days duration, and discount badges. Changes reflect live on the user checkout page.
            </div>
          </div>
        </div>

        <div id="plansGrid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px">
          <div style="padding:24px;text-align:center;color:var(--text-muted)">Loading plan configs…</div>
        </div>
      </section>

      <!-- Payment Verification Requests Section -->
      <section class="card admin-card-theme" id="paymentReqSection" style="padding:24px;border:1px solid rgba(245,158,11,0.3) !important;margin-bottom:28px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <h2 style="font-size:17px;font-weight:700;color:#f59e0b;margin:0 0 4px 0;display:flex;align-items:center;gap:6px">
              ${icon('sparkle', 16)} Pending Razorpay / UPI Subscriptions
            </h2>
            <div style="font-size:13px;color:var(--text-muted)">User payments awaiting administrative verification.</div>
          </div>
        </div>

        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;text-align:left;font-size:13px">
            <thead>
              <tr style="border-bottom:1px solid var(--border);color:var(--text-muted);font-size:11px;text-transform:uppercase">
                <th style="padding:8px 12px">User</th>
                <th style="padding:8px 12px">Plan Cycle</th>
                <th style="padding:8px 12px">Amount</th>
                <th style="padding:8px 12px">Transaction / UTR Reference</th>
                <th style="padding:8px 12px">Submitted At</th>
                <th style="padding:8px 12px;text-align:right">Action</th>
              </tr>
            </thead>
            <tbody id="paymentReqBody">
              <tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text-muted)">No pending payment approvals.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- User Database Section -->
      <section class="card admin-card-theme" style="padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:var(--text-bright);margin:0 0 4px 0">User Database &amp; Subscription Controls</h2>
            <div style="font-size:13px;color:var(--text-muted)">Full account directory with real-time plan status and login telemetry.</div>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <input type="search" id="userFilter" class="input" placeholder="Search by name or email…" style="width:240px;height:36px;font-size:13px" />
            <button id="refreshBtn" class="btn btn-outline btn-sm">Refresh</button>
          </div>
        </div>

        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;text-align:left;font-size:13px">
            <thead>
              <tr style="border-bottom:1px solid var(--border);color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.05em">
                <th style="padding:10px 12px">User</th>
                <th style="padding:10px 12px">Plan Status</th>
                <th style="padding:10px 12px;text-align:center">Logins</th>
                <th style="padding:10px 12px">Last Login</th>
                <th style="padding:10px 12px">Registered</th>
                <th style="padding:10px 12px;text-align:right">Plan Override</th>
              </tr>
            </thead>
            <tbody id="userTableBody">
              <tr><td colspan="6" style="padding:32px;text-align:center;color:var(--text-muted)">Loading user data…</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  `;

  // Theme Management
  const themeToggleBtn = document.getElementById('adminThemeToggle');
  const themeIcon = document.getElementById('adminThemeIcon');

  function setAdminTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('taskflow_admin_theme', theme);
    if (themeIcon) {
      themeIcon.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    }
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
    }
  }

  const currentAdminTheme = localStorage.getItem('taskflow_admin_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setAdminTheme(currentAdminTheme);

  themeToggleBtn.onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    setAdminTheme(cur === 'dark' ? 'light' : 'dark');
  };

  document.getElementById('adminLogoutBtn').onclick = async () => {
    localStorage.removeItem('taskflow_admin_token');
    localStorage.removeItem('taskflow_admin_user');
    Store.clear();
    location.href = 'admin-login.html';
  };

  let cachedUsers = [];

  async function loadData() {
    try {
      const [res, plansRes] = await Promise.all([
        API.get('/admin/overview'),
        API.get('/admin/plans'),
      ]);

      if (!res.success) throw new Error(res.message);

      const { stats, users, paymentRequests } = res.data;
      cachedUsers = users;

      document.getElementById('statUsers').textContent = stats.totalUsers;
      document.getElementById('statPro').textContent = stats.proSubscribers || 0;
      document.getElementById('statPending').textContent = stats.pendingApprovals || 0;
      document.getElementById('statLogins').textContent = stats.totalLogins;
      document.getElementById('statTasks').textContent = stats.totalTasks;

      if (plansRes.success && plansRes.plans) {
        renderPlansEditor(plansRes.plans);
      }

      renderPaymentRequests(paymentRequests || []);
      renderUsersTable(users);
    } catch (err) {
      document.getElementById('userTableBody').innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#ef4444">${esc(err.message || 'Failed to fetch data')}</td></tr>`;
    }
  }

  function renderPlansEditor(plans) {
    const grid = document.getElementById('plansGrid');
    if (!plans.length) {
      grid.innerHTML = `<div style="color:var(--text-muted)">No plans configured.</div>`;
      return;
    }

    grid.innerHTML = plans
      .map(
        (p) => `
        <div class="card admin-card-theme" style="padding:18px;border-radius:14px" id="planCard_${p.key}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <span style="font-weight:700;font-size:15px;color:var(--text-bright)">${esc(p.name)}</span>
            <span style="font-size:11px;font-family:var(--font-mono, monospace);padding:2px 6px;border-radius:6px;background:rgba(16,185,129,0.15);color:#10b981;text-transform:uppercase">${esc(p.key)}</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div>
              <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:4px;font-weight:600">Price (₹)</label>
              <input type="number" id="price_${p.key}" class="input" value="${p.price}" style="height:34px;font-size:13px;font-weight:700;color:#10b981" />
            </div>
            <div>
              <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:4px;font-weight:600">Duration (Days)</label>
              <input type="number" id="days_${p.key}" class="input" value="${p.days}" style="height:34px;font-size:13px" />
            </div>
          </div>

          <div style="margin-bottom:10px">
            <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:4px;font-weight:600">Badge / Promo Tag</label>
            <input type="text" id="badge_${p.key}" class="input" value="${esc(p.badge || '')}" placeholder="e.g. Popular • Save 20%" style="height:34px;font-size:12px" />
          </div>

          <div style="margin-bottom:14px">
            <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:4px;font-weight:600">Per-Month Subtext</label>
            <input type="text" id="equiv_${p.key}" class="input" value="${esc(p.equivalentText || '')}" placeholder="e.g. ₹233 / month" style="height:34px;font-size:12px" />
          </div>

          <button class="btn btn-primary btn-block btn-sm save-plan-btn" data-key="${p.key}" style="background:#10b981;border-color:#10b981;color:#000;font-weight:700;height:34px">
            Save Plan
          </button>
        </div>
      `
      )
      .join('');

    grid.querySelectorAll('.save-plan-btn').forEach((btn) => {
      btn.onclick = async () => {
        const key = btn.dataset.key;
        const price = Number(document.getElementById(`price_${key}`).value);
        const days = Number(document.getElementById(`days_${key}`).value);
        const badge = document.getElementById(`badge_${key}`).value.trim();
        const equivalentText = document.getElementById(`equiv_${key}`).value.trim();

        if (isNaN(price) || price <= 0) {
          toast('Please enter a valid price amount', 'error');
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Saving…';

        try {
          const res = await API.put(`/admin/plans/${key}`, {
            price,
            days,
            badge,
            equivalentText,
          });

          toast(res.message || 'Plan updated successfully!', 'success');
        } catch (err) {
          toast(err.message || 'Failed to update plan', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Save Plan';
        }
      };
    });
  }

  function renderPaymentRequests(requests) {
    const tbody = document.getElementById('paymentReqBody');
    if (!requests.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding:16px;text-align:center;color:var(--text-muted)">✨ All clear! No pending payments to review.</td></tr>`;
      return;
    }

    tbody.innerHTML = requests
      .map(
        (r) => `
        <tr class="admin-table-row">
          <td style="padding:12px">
            <div style="font-weight:600;color:var(--text-bright)">${esc(r.name)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${esc(r.email)}</div>
          </td>
          <td style="padding:12px">
            <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;background:rgba(16,185,129,0.15);color:#10b981;text-transform:uppercase">
              ${esc(r.plan)} (${esc(r.billingCycle)})
            </span>
          </td>
          <td style="padding:12px;font-weight:700;font-family:var(--font-mono, monospace);color:#10b981">
            ₹${r.amount || 299}
          </td>
          <td style="padding:12px">
            <code style="background:rgba(16,185,129,0.1);padding:3px 8px;border-radius:6px;font-size:12px;color:#10b981;font-weight:600">${esc(r.transactionId)}</code>
          </td>
          <td style="padding:12px;color:var(--text-muted);font-size:12px">
            ${r.requestedAt ? new Date(r.requestedAt).toLocaleString() : '-'}
          </td>
          <td style="padding:12px;text-align:right">
            <button class="btn btn-primary btn-xs approve-btn" data-user="${r.userId}" style="background:#10b981;border-color:#10b981;color:#000;font-weight:800;padding:4px 10px">
              ✅ Approve Pro
            </button>
          </td>
        </tr>
      `
      )
      .join('');

    tbody.querySelectorAll('.approve-btn').forEach((btn) => {
      btn.onclick = async () => {
        const userId = btn.dataset.user;
        btn.disabled = true;
        btn.textContent = 'Approving…';
        try {
          const res = await API.post('/admin/approve-subscription', { userId });
          toast(res.message || 'Subscription approved!', 'success');
          loadData();
        } catch (err) {
          toast(err.message || 'Approval failed', 'error');
          btn.disabled = false;
          btn.textContent = '✅ Approve Pro';
        }
      };
    });
  }

  function renderUsersTable(users) {
    const tbody = document.getElementById('userTableBody');
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--text-muted)">No matching users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = users
      .map(
        (u) => `
        <tr class="admin-table-row">
          <td style="padding:12px">
            <div style="font-weight:600;color:var(--text-bright)">${esc(u.name)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${esc(u.email)}</div>
            ${u.phone ? `<div style="font-size:11px;color:#10b981;font-weight:600;margin-top:2px;display:flex;align-items:center;gap:4px">📱 ${esc(u.phone)}</div>` : '<div style="font-size:11px;color:var(--text-muted);opacity:0.6">No phone registered</div>'}
          </td>
          <td style="padding:12px">
            ${
              u.isPro
                ? '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:800;background:linear-gradient(135deg,#10b981,#0284c7);color:#fff">PRO ACTIVE</span>'
                : u.subscriptionStatus === 'pending_approval'
                ? '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;background:rgba(245,158,11,0.15);color:#f59e0b">PENDING APPROVAL</span>'
                : '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:rgba(100,116,139,0.15);color:var(--text-muted)">FREE</span>'
            }
          </td>
          <td style="padding:12px;text-align:center;font-weight:700;font-family:var(--font-mono, monospace);color:#10b981">
            ${u.loginCount || 0}
          </td>
          <td style="padding:12px;color:var(--text-muted);font-size:12px">
            ${u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '<span style="opacity:0.4">Never</span>'}
          </td>
          <td style="padding:12px;color:var(--text-muted);font-size:12px">
            ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
          </td>
          <td style="padding:12px;text-align:right">
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
              <select class="select select-sm plan-select" data-user="${u.id}" style="width:100px;height:30px;font-size:12px">
                <option value="free" ${!u.isPro ? 'selected' : ''}>Free</option>
                <option value="pro" ${u.isPro ? 'selected' : ''}>Pro Tier</option>
              </select>
              ${
                u.email.toLowerCase() === 'dikshantgaikwad99@gmail.com' || u.role === 'admin'
                  ? '<span style="font-size:11px;color:var(--text-muted);font-weight:600;padding:4px 8px;background:rgba(16,185,129,0.1);border-radius:6px;color:#10b981">Master</span>'
                  : `<button class="btn btn-outline btn-xs delete-user-btn" data-user="${u.id}" data-name="${esc(u.name)}" style="color:#ef4444;border-color:rgba(239,68,68,0.4);font-size:11px;padding:3px 8px;border-radius:6px" title="Permanently delete user and their tasks">
                      🗑️ Delete
                    </button>`
              }
            </div>
          </td>
        </tr>
      `
      )
      .join('');

    tbody.querySelectorAll('.plan-select').forEach((sel) => {
      sel.onchange = async () => {
        const userId = sel.dataset.user;
        const plan = sel.value;
        try {
          const res = await API.post('/admin/set-plan', { userId, plan });
          toast(res.message || 'Plan updated', 'success');
          loadData();
        } catch (err) {
          toast(err.message || 'Failed to update plan', 'error');
        }
      };
    });

    tbody.querySelectorAll('.delete-user-btn').forEach((btn) => {
      btn.onclick = async () => {
        const userId = btn.dataset.user;
        const userName = btn.dataset.name;
        if (!confirm(`Are you sure you want to permanently delete user "${userName}" and all their tasks? This action cannot be undone.`)) {
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Deleting…';
        try {
          const res = await API.delete('/admin/users/' + userId);
          toast(res.message || 'User deleted successfully', 'success');
          loadData();
        } catch (err) {
          toast(err.message || 'Failed to delete user', 'error');
          btn.disabled = false;
          btn.textContent = '🗑️ Delete';
        }
      };
    });
  }

  document.getElementById('userFilter').oninput = (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderUsersTable(cachedUsers);
      return;
    }
    const filtered = cachedUsers.filter(
      (u) => (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q))
    );
    renderUsersTable(filtered);
  };

  document.getElementById('refreshBtn').onclick = () => {
    loadData();
  };

  await loadData();
})();
