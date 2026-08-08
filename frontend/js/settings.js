/* ============================================================
   settings.js — appearance, notifications, danger zone
   ============================================================ */
(async function () {
  const user = await requireAuth();
  if (!user) return;

  const page = renderShell({
    active: 'settings',
    title: 'Settings',
    subtitle: 'Make TaskFlow work the way you do',
    search: false,
  });

  const s = user.settings || {};
  const notif = s.notifications || {};

  page.innerHTML = `
    <div class="dash-grid">
      <div class="dash-col">
        <section class="card">
          <div class="card-head"><h2 class="card-title">${icon('sun', 16)} Appearance</h2></div>

          <div class="settings-row">
            <div>
              <div class="t">Theme</div>
              <div class="d">Light, dark, or follow your operating system.</div>
            </div>
            <div class="segmented" id="themeSeg" role="radiogroup" aria-label="Theme">
              ${['light', 'dark', 'system'].map((t) => `<button data-theme-opt="${t}" class="${(s.theme || 'system') === t ? 'active' : ''}" role="radio" aria-checked="${(s.theme || 'system') === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}
            </div>
          </div>

          <div class="settings-row">
            <div>
              <div class="t">Compact mode</div>
              <div class="d">Tighter spacing so more fits on screen.</div>
            </div>
            <button class="switch ${s.compactMode ? 'on' : ''}" id="compactSw" role="switch" aria-checked="${!!s.compactMode}" aria-label="Compact mode"></button>
          </div>

          <div class="settings-row">
            <div>
              <div class="t">Week starts on</div>
              <div class="d">Affects the calendar grid.</div>
            </div>
            <select class="select select-sm" id="weekStart">
              <option value="monday" ${s.weekStart === 'monday' ? 'selected' : ''}>Monday</option>
              <option value="sunday" ${s.weekStart === 'sunday' ? 'selected' : ''}>Sunday</option>
            </select>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2 class="card-title">${icon('bell', 16)} Notifications</h2></div>

          ${toggleRow('dueSoon', 'Due soon alerts', 'Notify me when a task is due within three days.', notif.dueSoon !== false)}
          ${toggleRow('dailyDigest', 'Daily digest', "A summary of today's subtasks when you open the app.", !!notif.dailyDigest)}
          ${toggleRow('streakReminder', 'Streak reminder', "Remind me if I haven't completed anything today.", notif.streakReminder !== false)}
        </section>

        <section class="card">
          <div class="card-head"><h2 class="card-title" style="color:var(--rose)">${icon('alert', 16)} Danger zone</h2></div>
          <div class="settings-row">
            <div>
              <div class="t">Delete account</div>
              <div class="d">Permanently removes your account, tasks, subtasks and categories. This cannot be undone.</div>
            </div>
            <button class="btn btn-danger btn-sm" id="delAccount">Delete account</button>
          </div>
        </section>
      </div>

      <div class="dash-col">
        <section class="card">
          <div class="card-head"><h2 class="card-title">${icon('info', 16)} About TaskFlow</h2></div>
          <div class="detail-list">
            <div class="detail-item"><span class="k">Version</span><span class="v">1.0.0</span></div>
            <div class="detail-item"><span class="k">Frontend</span><span class="v">HTML · CSS · JavaScript</span></div>
            <div class="detail-item"><span class="k">Backend</span><span class="v">Node.js · Express</span></div>
            <div class="detail-item"><span class="k">Database</span><span class="v">MongoDB · Mongoose</span></div>
            <div class="detail-item"><span class="k">Auth</span><span class="v">JWT · bcrypt</span></div>
            <div class="detail-item"><span class="k">Signed in as</span><span class="v">${esc(user.email)}</span></div>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2 class="card-title">${icon('lock', 16)} Data isolation</h2></div>
          <div class="card-pad">
            <p class="text-sm muted">
              Every task, subtask and category is written with your user id attached, and every read query filters by
              it. Another account signing in on this same server can never see your data.
            </p>
            <a class="btn btn-secondary btn-sm mt-4" href="profile.html">${icon('download', 15)} Export or delete data</a>
          </div>
        </section>
      </div>
    </div>`;

  function toggleRow(key, title, desc, on) {
    return `<div class="settings-row">
      <div><div class="t">${esc(title)}</div><div class="d">${esc(desc)}</div></div>
      <button class="switch ${on ? 'on' : ''}" data-notif="${key}" role="switch" aria-checked="${on}" aria-label="${esc(title)}"></button>
    </div>`;
  }

  const save = debounce(async (patch) => {
    try {
      const { user: fresh } = await API.updateSettings(patch);
      Store.set('user', fresh);
      toast('Settings saved');
    } catch (err) {
      toast(err.message, 'error');
    }
  }, 320);

  /* theme */
  $$('[data-theme-opt]').forEach((b) => {
    b.onclick = () => {
      const v = b.dataset.themeOpt;
      $$('[data-theme-opt]').forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-checked', String(x === b));
      });
      Theme.set(v);
      save({ theme: v });
    };
  });

  /* compact */
  $('#compactSw').onclick = () => {
    const on = !$('#compactSw').classList.contains('on');
    $('#compactSw').classList.toggle('on', on);
    $('#compactSw').setAttribute('aria-checked', String(on));
    document.documentElement.classList.toggle('compact', on);
    save({ compactMode: on });
  };

  $('#weekStart').onchange = (e) => save({ weekStart: e.target.value });

  /* notifications */
  $$('[data-notif]').forEach((btn) => {
    btn.onclick = () => {
      const on = !btn.classList.contains('on');
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-checked', String(on));
      const next = {};
      $$('[data-notif]').forEach((b) => (next[b.dataset.notif] = b.classList.contains('on')));
      save({ notifications: next });
    };
  });

  /* danger */
  $('#delAccount').onclick = async () => {
    const ok = await confirmDialog({
      title: 'Delete your account?',
      body: 'Your account and every task, subtask and category belonging to it will be permanently erased. This cannot be undone.',
      confirmText: 'Yes, delete everything',
      danger: true,
    });
    if (!ok) return;
    try {
      await API.deleteAccount();
      Store.clear();
      location.href = 'index.html';
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (s.compactMode) document.documentElement.classList.add('compact');
})();
