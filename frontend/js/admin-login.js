/* ============================================================
   admin-login.js — Clean Administrator Authentication Logic
   ============================================================ */
(function () {
  const form = document.getElementById('adminLoginForm');
  const emailInput = document.getElementById('adminEmail');
  const passwordInput = document.getElementById('adminPassword');
  const errorBox = document.getElementById('errorBox');
  const errorMsg = document.getElementById('errorMsg');
  const submitBtn = document.getElementById('submitBtn');
  const togglePwdBtn = document.getElementById('togglePwdBtn');
  const eyeIcon = document.getElementById('eyeIcon');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  const ICONS = {
    moon: '<path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 1.5v2.2M12 20.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M1.5 12h2.2M20.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  };

  /* ---------------- Theme Management ---------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('taskflow_admin_theme', theme);
    if (themeIcon) {
      themeIcon.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    }
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
    }
  }

  const savedTheme = localStorage.getItem('taskflow_admin_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.onclick = () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    };
  }

  /* ---------------- Password Visibility Toggle ---------------- */
  if (togglePwdBtn && passwordInput) {
    togglePwdBtn.onclick = () => {
      const isPwd = passwordInput.type === 'password';
      passwordInput.type = isPwd ? 'text' : 'password';
      eyeIcon.innerHTML = isPwd ? ICONS.eyeOff : ICONS.eye;
      passwordInput.focus();
    };
  }

  /* ---------------- Error Helpers ---------------- */
  function showError(msg) {
    if (errorMsg) errorMsg.textContent = msg;
    if (errorBox) errorBox.classList.remove('hidden');
  }

  function clearError() {
    if (errorMsg) errorMsg.textContent = '';
    if (errorBox) errorBox.classList.add('hidden');
  }

  /* ---------------- Form Submission ---------------- */
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      clearError();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showError('Please enter both admin email and password.');
        return;
      }

      const originalHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg style="animation:spin 1s linear infinite" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span>Verifying credentials…</span>
      `;

      try {
        const res = await API.post('/admin/login', { email, password });
        if (!res.success) {
          throw new Error(res.message || 'Administrator authentication failed.');
        }

        // Store dedicated admin token
        localStorage.setItem('taskflow_admin_token', res.token);
        localStorage.setItem('taskflow_admin_user', JSON.stringify(res.admin));

        if (typeof Store !== 'undefined' && Store.session) {
          Store.session(res.token, res.admin);
        }

        submitBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Authenticated! Entering…</span>
        `;
        submitBtn.style.background = '#059669';

        setTimeout(() => {
          location.href = 'admin.html';
        }, 350);
      } catch (err) {
        showError(err.message || 'Invalid administrator email or password.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        submitBtn.style.background = '';
      }
    };
  }
})();
