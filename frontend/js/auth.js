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
  const noteIcon = document.getElementById('noteIcon');
  if (noteIcon) noteIcon.innerHTML = icon('sparkle', 15);

  // Real-time Dynamic Date Demo Pitch Card
  (function initRealtimeDemoCard() {
    const pitchCard = document.querySelector('.pitch-card');
    if (!pitchCard) return;

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    function getDateOffset(offset) {
      const d = new Date();
      d.setDate(now.getDate() + offset);
      return `${months[d.getMonth()]} ${d.getDate()}`;
    }

    const items = [
      { title: 'Learn HTML', offset: -2, done: true },
      { title: 'Learn CSS', offset: -1, done: true },
      { title: 'Learn JavaScript', offset: 0, done: true, isToday: true },
      { title: 'Learn Node.js', offset: 1, done: false },
      { title: 'Build a project', offset: 2, done: false },
    ];

    let doneCount = 0;
    let rowsHTML = '';

    items.forEach((item, idx) => {
      if (item.done) doneCount++;
      const dateStr = getDateOffset(item.offset);
      rowsHTML += `
        <div class="pc-row ${item.done ? 'done' : ''}" style="display:flex;align-items:center;gap:10px;margin-top:10px;font-size:12px;color:${item.done ? 'inherit' : '#94a3b8'}">
          <span class="pc-check" id="pcCheck_${idx}">
            ${item.done ? icon('check', 11) : ''}
          </span>
          <span style="${item.done ? 'text-decoration:line-through;opacity:0.65' : ''}">
            <b style="font-family:var(--font-mono, monospace);font-weight:700;color:${item.isToday ? '#37c98a' : 'inherit'}">${dateStr}</b> — ${item.title}
            ${item.isToday ? `<span style="font-size:9.5px;font-weight:800;background:rgba(55,201,138,0.2);color:#37c98a;padding:1px 5px;border-radius:4px;margin-left:4px;text-transform:uppercase;letter-spacing:0.04em">Today</span>` : ''}
          </span>
        </div>
      `;
    });

    const pct = Math.round((doneCount / items.length) * 100);

    pitchCard.innerHTML = `
      <div class="pc-title" style="font-weight:700;font-size:13.5px;color:#fff;margin-bottom:8px">Learn Full Stack Development</div>
      ${rowsHTML}
      <div class="pc-bar"><i style="width:${pct}%"></i></div>
      <div class="pc-meta"><span>${doneCount} of ${items.length} done</span><span>${pct}%</span></div>
    `;
  })();

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
      const phoneInput = $('#phone');
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const password = pw.value;
      const confirm = $('#confirm').value;

      if (name.length < 2) return showError('Please enter your full name.');
      if (!/^\S+@\S+\.\S+$/.test(email)) return showError('That email address does not look right.');
      if (phone && phone.replace(/\D/g, '').length < 8) return showError('Please enter a valid mobile number with at least 8 digits.');
      if (password.length < 6) return showError('Password must be at least 6 characters.');
      if (password !== confirm) return showError('Passwords do not match.');

      const btn = $('#submitBtn');
      busy(btn, true, 'Create account');
      try {
        const { user } = await API.signup({ name, email, phone, password });
        toast(`Account created — welcome, ${user.name.split(' ')[0]}`);
        setTimeout(() => (location.href = 'dashboard.html'), 300);
      } catch (err) {
        showError(err.message);
        busy(btn, false, 'Create account');
      }
    });
  }
})();
