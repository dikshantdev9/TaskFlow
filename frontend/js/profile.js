/* ============================================================
   profile.js — account details, password, lifetime stats
   ============================================================ */
(async function () {
  const user = await requireAuth();
  if (!user) return;

  const page = renderShell({
    active: 'profile',
    title: 'Profile',
    subtitle: 'Your account and lifetime numbers',
    search: false,
  });

  const AVATAR_COLORS = ['#0F7A52', '#0369A1', '#B45309', '#BE123C', '#6D28D9', '#0E7490', '#4D7C0F', '#9D174D'];
  let avatarColor = user.avatarColor || AVATAR_COLORS[0];

  const { stats } = await API.stats();

  page.innerHTML = `
    <div class="dash-grid">
      <div class="dash-col">
        <section class="card">
          <div class="profile-hero">
            <span class="avatar avatar-xl" id="bigAvatar" style="background:${esc(avatarColor)}">${esc(initials(user.name))}</span>
            <div class="grow">
              <h2>${esc(user.name)}</h2>
              <p class="text-sm muted">${esc(user.email)}</p>
              <p class="text-xs faint mt-2">Member since ${fmtDate(user.createdAt)} · ${esc(user.timezone || 'Local time')}</p>
            </div>
            <span class="badge badge-primary">${icon('flame', 12)} ${stats.streak.current}-day streak</span>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2 class="card-title">${icon('user', 16)} Account details</h2></div>
          <form class="card-pad" id="profileForm">
            <div class="form-grid">
              <div class="field">
                <label class="label" for="pName">Full name</label>
                <input class="input" id="pName" value="${esc(user.name)}" />
              </div>
              <div class="field">
                <label class="label" for="pEmail">Email address</label>
                <input class="input" type="email" id="pEmail" value="${esc(user.email)}" />
              </div>
            </div>
            <div class="field mt-4">
              <label class="label" for="pBio">Short bio</label>
              <textarea class="textarea" id="pBio" rows="2" placeholder="What are you working towards?">${esc(user.bio || '')}</textarea>
            </div>
            <div class="field mt-4">
              <label class="label">Avatar colour</label>
              <div class="color-picker" id="pColors">
                ${AVATAR_COLORS.map((c) => `<button type="button" class="swatch ${c.toLowerCase() === avatarColor.toLowerCase() ? 'selected' : ''}" data-color="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}
              </div>
            </div>
            <button class="btn btn-primary mt-5" type="submit" id="pSave">Save changes</button>
          </form>
        </section>

        <section class="card">
          <div class="card-head"><h2 class="card-title">${icon('lock', 16)} Change password</h2></div>
          <form class="card-pad" id="pwForm">
            <div class="form-grid">
              <div class="field">
                <label class="label" for="curPw">Current password</label>
                <input class="input" type="password" id="curPw" autocomplete="current-password" />
              </div>
              <div class="field">
                <label class="label" for="newPw">New password</label>
                <input class="input" type="password" id="newPw" autocomplete="new-password" />
              </div>
            </div>
            <button class="btn btn-secondary mt-5" type="submit">Update password</button>
          </form>
        </section>
      </div>

      <div class="dash-col">
        <section class="card">
          <div class="card-head"><h2 class="card-title">${icon('trending', 16)} Lifetime stats</h2></div>
          <div class="detail-list">
            <div class="detail-item"><span class="k">Tasks created</span><span class="v mono">${stats.total}</span></div>
            <div class="detail-item"><span class="k">Tasks completed</span><span class="v mono">${stats.completed}</span></div>
            <div class="detail-item"><span class="k">Subtasks completed</span><span class="v mono">${stats.completedSubtasks} / ${stats.totalSubtasks}</span></div>
            <div class="detail-item"><span class="k">Overall progress</span><span class="v mono">${stats.overallProgress}%</span></div>
            <div class="detail-item"><span class="k">Current streak</span><span class="v mono">${stats.streak.current} days</span></div>
            <div class="detail-item"><span class="k">Longest streak</span><span class="v mono">${stats.streak.longest} days</span></div>
            <div class="detail-item"><span class="k">Pinned tasks</span><span class="v mono">${stats.pinned}</span></div>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2 class="card-title">${icon('target', 16)} Overall completion</h2></div>
          <div class="card-pad center">
            ${Charts.ring(stats.overallProgress, { size: 138, thickness: 11, label: 'complete' })}
            <p class="text-xs faint mt-4">Across every task in your account.</p>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2 class="card-title">${icon('download', 16)} Your data</h2></div>
          <div class="card-pad">
            <p class="text-sm muted">Every task, subtask and category is stored permanently in MongoDB under your account only. Download a full JSON copy any time.</p>
            <button class="btn btn-secondary mt-4" id="exportBtn">${icon('download', 15)} Export my data</button>
          </div>
        </section>
      </div>
    </div>`;

  $$('#pColors .swatch').forEach((s) => {
    s.onclick = () => {
      $$('#pColors .swatch').forEach((x) => x.classList.remove('selected'));
      s.classList.add('selected');
      avatarColor = s.dataset.color;
      $('#bigAvatar').style.background = avatarColor;
    };
  });

  $('#profileForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = $('#pSave');
    btn.disabled = true;
    try {
      const { user: fresh } = await API.updateProfile({
        name: $('#pName').value.trim(),
        email: $('#pEmail').value.trim(),
        bio: $('#pBio').value.trim(),
        avatarColor,
      });
      Store.set('user', fresh);
      toast('Profile updated');
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  };

  $('#pwForm').onsubmit = async (e) => {
    e.preventDefault();
    const currentPassword = $('#curPw').value;
    const newPassword = $('#newPw').value;
    if (newPassword.length < 6) return toast('New password must be at least 6 characters', 'error');
    try {
      await API.changePassword({ currentPassword, newPassword });
      $('#curPw').value = '';
      $('#newPw').value = '';
      toast('Password updated');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  $('#exportBtn').onclick = async () => {
    try {
      const data = await API.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `taskflow-export-${todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('Export downloaded');
    } catch (err) {
      toast(err.message, 'error');
    }
  };
})();
