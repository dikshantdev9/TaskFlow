/* ============================================================
   dashboard.js — the home screen
   ============================================================ */
(async function () {
  const user = await requireAuth();
  if (!user) return;

  const page = renderShell({
    active: 'dashboard',
    title: 'Dashboard',
    subtitle: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    search: true,
    actions: `<button class="btn btn-primary btn-sm" id="newTaskBtn">${icon('plus', 15)} <span class="label">New task</span></button>`,
  });

  page.innerHTML = `
    <div class="greeting">
      <h2>${esc(greetingText())}, ${esc(user.name.split(' ')[0])}</h2>
      <p id="greetSub" class="muted text-sm">Loading your day…</p>
    </div>
    <div class="stat-grid" id="statGrid">
      ${'<div class="skeleton" style="height:148px;border-radius:var(--radius-xl)"></div>'.repeat(5)}
    </div>
    <div class="dash-grid">
      <div class="dash-col" id="colMain"></div>
      <div class="dash-col" id="colSide"></div>
    </div>`;

  await TaskStore.loadMeta();
  window.__onTaskSaved = () => load();
  TaskModal.mount(window.__onTaskSaved);
  $('#newTaskBtn').onclick = () => window.openTaskModal();

  const search = $('#globalSearch');
  if (search)
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.value.trim())
        location.href = `tasks.html?view=all&q=${encodeURIComponent(e.target.value.trim())}`;
    });

  async function load() {
    let s;
    try {
      ({ stats: s } = await API.stats());
    } catch (err) {
      page.innerHTML = emptyState('alert', 'Could not load your dashboard', err.message);
      return;
    }

    const doneToday = s.todaySubtasks.filter((t) => t.completed).length;
    $('#greetSub').textContent = s.total
      ? `${s.todaySubtasks.length} subtask${s.todaySubtasks.length === 1 ? '' : 's'} scheduled today · ${doneToday} done · ${s.pending} task${s.pending === 1 ? '' : 's'} still open`
      : 'Nothing here yet — create your first task to get started.';

    /* ------------------------------------------------- stat cards */
    $('#statGrid').innerHTML = `
      ${statCard('Total tasks', s.total, 'tasks', 'sky', `${s.totalSubtasks} subtasks in total`)}
      ${statCard('Completed', s.completed, 'completed', 'emerald', `${s.completedSubtasks} subtasks ticked off`)}
      ${statCard('Pending', s.pending, 'clock', 'amber', s.overdue ? `${s.overdue} subtask${s.overdue === 1 ? '' : 's'} overdue` : 'Nothing overdue')}
      <div class="stat">
        <div class="stat-top">
          <span class="stat-label">Overall progress</span>
          <span class="stat-icon emerald">${icon('target', 16)}</span>
        </div>
        <div class="stat-value">${s.overallProgress}<span class="unit">%</span></div>
        <div class="progress progress-sm stat-bar ${s.overallProgress === 100 ? 'is-done' : ''}">
          <div class="progress-fill" style="width:${s.overallProgress}%"></div>
        </div>
        <div class="stat-meta">${s.completedSubtasks} of ${s.totalSubtasks} subtasks complete</div>
      </div>
      <div class="stat streak-card">
        <div class="stat-top">
          <span class="stat-label">Productivity streak</span>
          <span class="stat-icon amber flame">${icon('flame', 16)}</span>
        </div>
        <div class="stat-value">${s.streak.current}<span class="unit">days</span></div>
        <div class="stat-meta">Longest streak: ${s.streak.longest} days${s.streak.current ? ' · keep it alive today' : ' · complete a subtask to start'}</div>
      </div>`;

    /* ---------------------------------------------------- main col */
    $('#colMain').innerHTML = `
      ${card(
        `${icon('today', 16)} Today's tasks`,
        s.todaySubtasks.length
          ? s.todaySubtasks.map(subRow).join('')
          : `<div class="card-pad">${emptyState('sparkle', 'Nothing due today', 'Enjoy the breathing room, or pull a subtask forward.')}</div>`,
        s.todaySubtasks.length ? `<span class="badge badge-primary">${doneToday}/${s.todaySubtasks.length} done</span>` : ''
      )}

      ${card(
        `${icon('analytics', 16)} Weekly progress`,
        `<div class="chart-wrap">${Charts.bars(s.weekly.map((w) => ({ label: w.label, value: w.completed })))}</div>
         <div class="metric-row">
           <div class="metric"><div class="l">This week</div><div class="v mono">${s.weekly.reduce((n, w) => n + w.completed, 0)}</div></div>
           <div class="metric"><div class="l">Daily average</div><div class="v mono">${(s.weekly.reduce((n, w) => n + w.completed, 0) / 7).toFixed(1)}</div></div>
           <div class="metric"><div class="l">Best day</div><div class="v mono">${bestLabel(s.weekly)}</div></div>
         </div>`,
        `<a class="text-xs strong" href="analytics.html" style="color:var(--primary)">Full analytics →</a>`
      )}

      <div class="section-head mt-6">
        <h2>Recent tasks</h2>
        <a href="tasks.html?view=all">View all →</a>
      </div>
      <div class="task-grid" id="recentGrid">
        ${s.recentTasks.length ? s.recentTasks.map(taskCard).join('') : ''}
      </div>
      ${s.recentTasks.length ? '' : emptyState('tasks', 'No tasks yet', 'Create your first task and break it into date-wise subtasks.', `<button class="btn btn-primary btn-sm mt-4" id="firstTask">${icon('plus', 15)} Create your first task</button>`)}
    `;

    /* ---------------------------------------------------- side col */
    const priorityData = s.byPriority.map((p) => ({
      label: PRIORITY_LABEL[p.priority],
      value: p.count,
      color: `var(--p-${p.priority})`,
    }));
    const openTotal = priorityData.reduce((n, p) => n + p.value, 0);

    $('#colSide').innerHTML = `
      ${card(
        `${icon('trending', 16)} Completion`,
        `<div class="card-pad center">
          ${Charts.ring(s.overallProgress, { size: 132, thickness: 11, label: 'overall' })}
          <p class="text-xs faint mt-4">${s.completedSubtasks} of ${s.totalSubtasks} subtasks completed across ${s.total} task${s.total === 1 ? '' : 's'}.</p>
        </div>`
      )}

      ${card(
        `${icon('zap', 16)} Open by priority`,
        `<div class="card-pad donut-wrap">
          ${Charts.donut(priorityData, { size: 132, thickness: 16, centerValue: openTotal, centerLabel: 'open' })}
          <div class="legend">
            ${priorityData
              .map(
                (p) => `<div class="legend-item">
                  <span class="legend-swatch" style="background:${p.color}"></span>
                  <span class="grow">${p.label}</span><span class="mono strong">${p.value}</span>
                </div>`
              )
              .join('')}
          </div>
        </div>`
      )}

      ${card(
        `${icon('calendar', 16)} Upcoming`,
        s.upcoming.length
          ? s.upcoming.map(subRow).join('')
          : `<div class="card-pad">${emptyState('calendar', 'Nothing upcoming', 'No subtasks scheduled in the next 7 days.')}</div>`,
        `<a class="text-xs strong" href="calendar.html" style="color:var(--primary)">Calendar →</a>`
      )}
    `;

    wireTaskCards($('#recentGrid'), load);
    wireSubRows(load);
    const ft = $('#firstTask');
    if (ft) ft.onclick = () => window.openTaskModal();
  }

  /* --------------------------------------------------- fragments */
  function statCard(label, value, ic, tone, meta) {
    return `<div class="stat">
      <div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${tone}">${icon(ic, 16)}</span></div>
      <div class="stat-value">${value}</div>
      <div class="stat-meta">${esc(meta)}</div>
    </div>`;
  }

  function card(title, body, action) {
    return `<section class="card">
      <div class="card-head"><h2 class="card-title">${title}</h2>${action || ''}</div>
      ${body}
    </section>`;
  }

  function bestLabel(weekly) {
    const best = weekly.reduce((m, w) => (w.completed > m.completed ? w : m), { label: '—', completed: 0 });
    return best.completed ? best.label : '—';
  }

  load();
})();

/* -------------------------------------- shared subtask row (dash) */
function subRow(s) {
  return `<div class="srow ${s.completed ? 'done' : ''}" data-sub="${s._id}" style="--accent:${esc(s.taskColor || '#0F7A52')}">
      <button class="check ${s.completed ? 'checked' : ''}" data-toggle="${s._id}" role="checkbox" aria-checked="${s.completed}" aria-label="Toggle ${esc(s.title)}">${icon('check', 13)}</button>
      <div class="srow-body">
        <div class="srow-title">${esc(s.title)}</div>
        <div class="srow-sub">
          <span class="srow-parent">${esc(s.taskTitle)}</span>
          <span>·</span>
          <span class="${isOverdue(s.date) && !s.completed ? 'meta-inline overdue' : ''}">${relDate(s.date)}</span>
          ${s.priority ? `<span>·</span>${priorityBadge(s.priority)}` : ''}
        </div>
      </div>
    </div>`;
}

function wireSubRows(onChange) {
  $$('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.srow');
      const next = !btn.classList.contains('checked');
      btn.classList.toggle('checked', next);
      row.classList.toggle('done', next);
      btn.setAttribute('aria-checked', String(next));
      try {
        await API.toggleSubtask(btn.dataset.toggle, next);
        if (next) toast('Nice — subtask completed');
        if (onChange) setTimeout(onChange, 380);
      } catch (err) {
        btn.classList.toggle('checked', !next);
        row.classList.toggle('done', !next);
        toast(err.message, 'error');
      }
    });
  });
}
