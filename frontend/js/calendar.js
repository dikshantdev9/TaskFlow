/* ============================================================
   calendar.js — month grid + day agenda
   ============================================================ */
(async function () {
  const user = await requireAuth();
  if (!user) return;

  const page = renderShell({
    active: 'calendar',
    title: 'Calendar',
    subtitle: 'Every subtask, laid out day by day',
    search: false,
    actions: `<button class="btn btn-primary btn-sm" id="newTaskBtn">${icon('plus', 15)} <span class="label">New task</span></button>`,
  });

  await TaskStore.loadMeta();
  window.__onTaskSaved = () => draw();
  TaskModal.mount(window.__onTaskSaved);

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // 1-12
  let days = {};
  let selected = todayKey();

  page.innerHTML = `
    <div class="card">
    <div class="cal-head">
      <div class="row gap-2 items-center">
        <button class="icon-btn" id="prevBtn" aria-label="Previous month">${icon('chevronLeft', 18)}</button>
        <h2 class="cal-month" id="calMonth">—</h2>
        <button class="icon-btn" id="nextBtn" aria-label="Next month">${icon('chevronRight', 18)}</button>
      </div>
      <div class="row gap-2">
        <button class="btn btn-secondary btn-sm" id="todayBtn">${icon('today', 15)} Today</button>
      </div>
    </div>

      <div class="cal-weekdays" id="weekdays"></div>
      <div class="cal-grid" id="calGrid"></div>
    </div>

    <section class="card mt-5">
      <div class="card-head"><h2 class="card-title" id="agendaTitle">Agenda</h2><span class="text-xs faint" id="agendaCount"></span></div>
      <div id="agenda"></div>
    </section>`;

  $('#newTaskBtn').onclick = () => window.openTaskModal();
  $('#prevBtn').onclick = () => shift(-1);
  $('#nextBtn').onclick = () => shift(1);
  $('#todayBtn').onclick = () => {
    year = new Date().getFullYear();
    month = new Date().getMonth() + 1;
    selected = todayKey();
    draw();
  };

  const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  $('#weekdays').innerHTML = WD.map((d) => `<span>${d}</span>`).join('');

  function shift(n) {
    month += n;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    draw();
  }

  async function draw() {
    $('#calMonth').textContent = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const grid = $('#calGrid');
    grid.innerHTML = `<div class="skeleton" style="height:520px;grid-column:1/-1"></div>`;

    try {
      ({ days } = await API.calendar(year, month));
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1">${emptyState('alert', 'Could not load calendar', err.message)}</div>`;
      return;
    }

    const first = new Date(year, month - 1, 1);
    // Monday-first offset
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();

    const cells = [];
    for (let i = offset - 1; i >= 0; i -= 1) {
      cells.push({ d: new Date(year, month - 2, prevMonthDays - i), out: true });
    }
    for (let d = 1; d <= daysInMonth; d += 1) cells.push({ d: new Date(year, month - 1, d), out: false });
    while (cells.length % 7 !== 0) {
      cells.push({ d: new Date(year, month - 1, cells.length - offset + 1), out: true });
    }

    grid.innerHTML = cells
      .map(({ d, out }) => {
        const key = dateKey(d);
        const items = days[key] || [];
        const shown = items.slice(0, 3);
        const rest = items.length - shown.length;
        return `<div class="cal-cell ${out ? 'out' : ''} ${key === todayKey() ? 'today' : ''} ${key === selected ? 'selected' : ''}" data-day="${key}" tabindex="0" role="button" aria-label="${fmtDate(key)}, ${items.length} subtasks">
            <span class="cal-date">${d.getDate()}</span>
            ${shown
              .map(
                (s) =>
                  `<span class="cal-pill ${s.completed ? 'done' : ''}" style="--accent:${esc(s.color || '#0F7A52')}" title="${esc(s.taskTitle)} — ${esc(s.title)}"><span>${esc(s.title)}</span></span>`
              )
              .join('')}
            ${rest > 0 ? `<span class="cal-more">+${rest} more</span>` : ''}
          </div>`;
      })
      .join('');

    $$('.cal-cell').forEach((c) => {
      const pick = () => {
        selected = c.dataset.day;
        $$('.cal-cell').forEach((x) => x.classList.toggle('selected', x === c));
        renderAgenda();
      };
      c.onclick = pick;
      c.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      };
    });

    renderAgenda();
  }

  function renderAgenda() {
    const items = days[selected] || [];
    $('#agendaTitle').textContent = `${fmtDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}`;
    $('#agendaCount').textContent = items.length
      ? `${items.filter((i) => i.completed).length} of ${items.length} done`
      : 'Nothing scheduled';

    const box = $('#agenda');
    if (!items.length) {
      box.innerHTML = `<div class="card-pad">${emptyState('calendar', 'A clear day', 'No subtasks are scheduled for this date.')}</div>`;
      return;
    }

    box.innerHTML = items
      .map(
        (s) => `<div class="srow ${s.completed ? 'done' : ''}" style="--accent:${esc(s.color || '#0F7A52')}">
          <button class="check ${s.completed ? 'checked' : ''}" data-toggle="${s._id}" role="checkbox" aria-checked="${s.completed}" aria-label="Toggle ${esc(s.title)}">${icon('check', 13)}</button>
          <div class="srow-body">
            <div class="srow-title">${esc(s.title)}</div>
            <div class="srow-sub">
              <span class="srow-parent">${esc(s.taskTitle)}</span><span>·</span>${priorityBadge(s.priority)}
            </div>
          </div>
          <a class="btn btn-ghost btn-sm" href="task.html?id=${s.taskId}">Open</a>
        </div>`
      )
      .join('');

    $$('[data-toggle]', box).forEach((btn) => {
      btn.onclick = async () => {
        const next = !btn.classList.contains('checked');
        btn.classList.toggle('checked', next);
        btn.closest('.srow').classList.toggle('done', next);
        try {
          await API.toggleSubtask(btn.dataset.toggle, next);
          const it = (days[selected] || []).find((x) => x._id === btn.dataset.toggle);
          if (it) it.completed = next;
          if (next) toast('Subtask completed');
          draw();
        } catch (err) {
          toast(err.message, 'error');
          btn.classList.toggle('checked', !next);
        }
      };
    });
  }

  draw();
})();
