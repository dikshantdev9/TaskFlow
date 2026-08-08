/* ============================================================
   auth.js — login + signup pages
   ============================================================ */
(function () {
  Theme.apply();
  $$('[data-theme-toggle]').forEach((b) => (b.onclick = () => Theme.toggle()));

  // decorative marks
  const mark = icon('logo', 26);
  ['asideMark', 'mobileMark'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = mark;
  });
  ['pc1', 'pc2', 'pc3'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon('check', 12);
  });
  const noteIcon = document.getElementById('noteIcon');
  if (noteIcon) noteIcon.innerHTML = icon('sparkle', 15);

  // password visibility
  $$('[data-pw-toggle]').forEach((btn) => {
    const input = document.getElementById(btn.getAttribute('data-pw-toggle'));
    btn.innerHTML = icon('eye', 17);
    btn.onclick = () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = icon(show ? 'eyeOff' : 'eye', 17);
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    };
  });

  const alertBox = $('#formAlert');
  const showError = (msg) => {
    if (!alertBox) return toast(msg, 'error');
    alertBox.innerHTML = `${icon('alert', 15)}<span>${esc(msg)}</span>`;
    alertBox.classList.remove('hidden');
  };
  const clearError = () => alertBox && alertBox.classList.add('hidden');

  const busy = (btn, on, label) => {
    btn.disabled = on;
    btn.innerHTML = on ? `<span class="spinner"></span> ${label}` : label;
  };

  // already signed in? go straight through
  if (Store.token()) {
    API.get('/auth/me')
      .then(() => (location.href = 'dashboard.html'))
      .catch(() => Store.clear());
  }

  /* --------------------------------------------------- login */
  const loginForm = $('#loginForm');
  if (loginForm) {
    const submit = $('#submitBtn');

    const doLogin = async (email, password, btn, label) => {
      clearError();
      busy(btn, true, label);
      try {
        const { user } = await API.login({ email, password });
        toast(`Welcome back, ${user.name.split(' ')[0]}`);
        setTimeout(() => (location.href = 'dashboard.html'), 260);
      } catch (err) {
        showError(err.message);
        busy(btn, false, label);
      }
    };

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#email').value.trim();
      const password = $('#password').value;
      if (!email || !password) return showError('Enter your email and password.');
      doLogin(email, password, submit, 'Sign in');
    });

    $('#demoBtn').onclick = () => {
      $('#email').value = 'demo@taskflow.app';
      $('#password').value = 'demo1234';
      doLogin('demo@taskflow.app', 'demo1234', $('#demoBtn'), 'Try the demo account');
    };
  }

  /* -------------------------------------------------- signup */
  const signupForm = $('#signupForm');
  if (signupForm) {
    const pw = $('#password');
    const meter = $('#strength');
    const meterText = $('#strengthText');

    const score = (v) => {
      let s = 0;
      if (v.length >= 6) s++;
      if (v.length >= 10) s++;
      if (/\d/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v) || /[A-Z]/.test(v)) s++;
      return Math.min(s, 4);
    };
    const LABELS = ['', 'Weak — add a few more characters', 'Fair — add a number', 'Good password', 'Strong password'];

    pw.addEventListener('input', () => {
      const s = pw.value ? score(pw.value) : 0;
      meter.className = `strength s${s}`;
      meterText.textContent = s ? LABELS[s] : 'Use 8+ characters with a number for a stronger password.';
    });

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();
      const name = $('#name').value.trim();
      const email = $('#email').value.trim();
      const password = pw.value;
      const confirm = $('#confirm').value;

      if (name.length < 2) return showError('Please enter your full name.');
      if (!/^\S+@\S+\.\S+$/.test(email)) return showError('That email address does not look right.');
      if (password.length < 6) return showError('Password must be at least 6 characters.');
      if (password !== confirm) return showError('Passwords do not match.');

      const btn = $('#submitBtn');
      busy(btn, true, 'Create account');
      try {
        const { user } = await API.signup({ name, email, password });
        toast(`Account created — welcome, ${user.name.split(' ')[0]}`);
        setTimeout(() => (location.href = 'dashboard.html'), 300);
      } catch (err) {
        showError(err.message);
        busy(btn, false, 'Create account');
      }
    });
  }
})();
