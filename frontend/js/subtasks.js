/* ============================================================
   subtasks.js — task detail page (date-wise subtask timeline)
   ============================================================ */
(async function () {
  const user = await requireAuth();
  if (!user) return;

  const taskId = new URLSearchParams(location.search).get('id');
  if (!taskId) {
    location.href = 'tasks.html?view=all';
    return;
  }

  const page = renderShell({
    active: 'tasks',
    title: 'Task detail',
    subtitle: 'Break it down, tick it off, watch the bar move',
    search: false,
    actions: `<a class="btn btn-secondary btn-sm" href="tasks.html?view=all">${icon('arrowLeft', 15)} All tasks</a>`,
  });

  await TaskStore.loadMeta();
  window.__onTaskSaved = () => load();
  TaskModal.mount(window.__onTaskSaved);

  let task = null;
  let subtasks = [];

  async function load() {
    page.innerHTML = `<div class="skeleton" style="height:230px;border-radius:var(--radius-xl)"></div>`;
    try {
      const d = await API.task(taskId);
      task = d.task;
      subtasks = d.subtasks;
    } catch (err) {
      page.innerHTML = emptyState('alert', 'Task not found', err.message, `<a class="btn btn-primary btn-sm mt-4" href="tasks.html?view=all">Back to tasks</a>`);
      return;
    }
    render();
  }

  function render() {
    const total = subtasks.length;
    const done = subtasks.filter((s) => s.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const cat = task.category;

    $('.topbar h1').textContent = task.title;

    page.innerHTML = `
      <section class="task-hero" style="--accent:${esc(task.color || '#0F7A52')}">
        <div class="task-hero-top">
          <div class="grow" style="min-width:260px">
            <h2>${esc(task.title)}</h2>
            ${task.description ? `<p class="desc">${esc(task.description)}</p>` : ''}
            <div class="hero-meta">
              ${priorityBadge(task.priority)}
              ${cat ? `<span class="badge badge-soft">${icon('folder', 12)} ${esc(cat.name)}</span>` : ''}
              <span class="badge ${task.status === 'completed' ? 'badge-primary' : 'badge-soft'}">
                ${task.status === 'completed' ? `${icon('check', 12)} Completed` : `${icon('clock', 12)} In progress`}
              </span>
              ${(task.tags || []).map((t) => `<span class="tag">#${esc(t)}</span>`).join('')}
            </div>
          </div>
          <div class="row gap-2">
            <button class="pin-btn ${task.pinned ? 'pinned' : ''}" id="pinBtn" aria-label="Pin task" title="Pin task">${icon('pin', 16)}</button>
            <button class="btn btn-secondary btn-sm" id="editBtn">${icon('edit', 15)} Edit</button>
            <button class="btn btn-ghost btn-sm" id="delBtn" style="color:var(--rose)">${icon('trash', 15)} Delete</button>
          </div>
        </div>

        <div class="progress-block">
          ${Charts.ring(pct, { size: 108, thickness: 9, label: 'complete' })}
          <div class="progress-detail">
            <div class="head">
              <span class="text-sm strong">${done} of ${total} subtasks completed</span>
              <span class="n">${pct}%</span>
            </div>
            <div class="progress progress-lg ${pct === 100 ? 'is-done' : ''}"><div class="progress-fill" style="width:${pct}%"></div></div>
            <p class="text-xs faint mt-2">Progress is calculated automatically: completed subtasks ÷ total subtasks × 100.</p>
          </div>
        </div>
      </section>

      <div class="task-layout">
        <div>
          <div class="section-head">
            <h2>Date-wise subtasks</h2>
            <span class="text-xs faint">${total} subtask${total === 1 ? '' : 's'}</span>
          </div>

          <form class="quick-add" id="quickAdd">
            <input class="input grow" id="qaTitle" placeholder="Add a subtask…" aria-label="Subtask title" />
            <input class="input" type="date" id="qaDate" value="${todayKey()}" aria-label="Subtask date" />
            <button class="btn btn-primary" type="submit">${icon('plus', 15)} Add</button>
          </form>

          <div class="timeline mt-5" id="timeline"></div>
        </div>

        <aside>
          <section class="card">
            <div class="card-head"><h2 class="card-title">${icon('info', 16)} Details</h2></div>
            <div class="detail-list">
              ${detail('Status', task.status === 'completed' ? 'Completed' : 'Active')}
              ${detail('Priority', PRIORITY_LABEL[task.priority])}
              ${detail('Category', cat ? cat.name : 'Uncategorised')}
              ${detail('Start date', task.startDate ? fmtDate(task.startDate) : 'Not set')}
              ${detail('Due date', task.dueDate ? `${fmtDate(task.dueDate)} · ${relDate(task.dueDate)}` : 'Not set')}
              ${detail('Created', fmtDate(task.createdAt))}
              ${task.completedAt ? detail('Completed', fmtDate(task.completedAt)) : ''}
            </div>
          </section>

          <section class="card mt-4">
            <div class="card-head"><h2 class="card-title">${icon('edit', 16)} Notes</h2></div>
            <div class="card-pad">
              <textarea class="textarea notes-box" id="notesBox" rows="6" placeholder="Anything worth remembering about this task…">${esc(task.notes || '')}</textarea>
              <button class="btn btn-secondary btn-sm mt-2" id="saveNotes">Save notes</button>
            </div>
          </section>
        </aside>
      </div>`;

    renderTimeline();
    wireHero();
  }

  function detail(label, value) {
    return `<div class="detail-item"><span class="k">${esc(label)}</span><span class="v">${esc(value)}</span></div>`;
  }

  function renderTimeline() {
    const tl = $('#timeline');
    if (!subtasks.length) {
      tl.innerHTML = emptyState('layers', 'No subtasks yet', 'Add your first daily step above — progress starts counting immediately.');
      return;
    }

    const groups = {};
    subtasks.forEach((s) => {
      const k = dateKey(s.date);
      (groups[k] = groups[k] || []).push(s);
    });

    tl.innerHTML = Object.keys(groups)
      .sort()
      .map((k) => {
        const items = groups[k];
        const allDone = items.every((s) => s.completed);
        return `<div class="day-group ${allDone ? 'all-done' : ''} ${k === todayKey() ? 'is-today' : ''}">
            <span class="day-node"></span>
            <div class="day-head">
              <span class="day-date">${fmtDate(k, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <span class="day-rel">${relDate(k)}</span>
              <span class="badge ${allDone ? 'badge-primary' : 'badge-soft'}">${items.filter((s) => s.completed).length}/${items.length}</span>
            </div>
            <div class="sub-list">${items.map(subItem).join('')}</div>
          </div>`;
      })
      .join('');

    wireSubItems();
  }

  function subItem(s) {
    return `<div class="sub-item ${s.completed ? 'done' : ''}" data-id="${s._id}">
        <button class="check ${s.completed ? 'checked' : ''}" data-toggle="${s._id}" role="checkbox" aria-checked="${s.completed}" aria-label="Toggle ${esc(s.title)}">${icon('check', 13)}</button>
        <div class="grow">
          <div class="sub-title">${esc(s.title)}</div>
          ${s.notes ? `<div class="sub-notes">${esc(s.notes)}</div>` : ''}
          ${s.completedAt ? `<div class="sub-notes">Completed ${relDate(s.completedAt).toLowerCase()}</div>` : ''}
        </div>
        <div class="sub-actions">
          <button class="draft-del" data-edit="${s._id}" aria-label="Rename subtask">${icon('edit', 15)}</button>
          <button class="draft-del" data-del="${s._id}" aria-label="Delete subtask">${icon('trash', 15)}</button>
        </div>
      </div>`;
  }

  function wireSubItems() {
    $$('[data-toggle]').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.toggle;
        const next = !btn.classList.contains('checked');
        btn.classList.toggle('checked', next);
        btn.closest('.sub-item').classList.toggle('done', next);
        try {
          await API.toggleSubtask(id, next);
          const s = subtasks.find((x) => x._id === id);
          s.completed = next;
          s.completedAt = next ? new Date().toISOString() : null;
          if (next && subtasks.every((x) => x.completed)) toast('Task complete — every subtask ticked');
          else if (next) toast('Subtask completed');
          setTimeout(load, 320);
        } catch (err) {
          toast(err.message, 'error');
          btn.classList.toggle('checked', !next);
        }
      };
    });

    $$('[data-del]').forEach((btn) => {
      btn.onclick = async () => {
        const ok = await confirmDialog({ title: 'Delete subtask?', body: 'Your task progress will be recalculated.', confirmText: 'Delete', danger: true });
        if (!ok) return;
        await API.deleteSubtask(btn.dataset.del);
        toast('Subtask deleted');
        load();
      };
    });

    $$('[data-edit]').forEach((btn) => {
      btn.onclick = () => {
        const s = subtasks.find((x) => x._id === btn.dataset.edit);
        const item = btn.closest('.sub-item');
        const titleEl = $('.sub-title', item);
        const input = document.createElement('input');
        input.className = 'input';
        input.value = s.title;
        titleEl.replaceWith(input);
        input.focus();
        input.select();
        const commit = async () => {
          const v = input.value.trim();
          if (v && v !== s.title) {
            await API.updateSubtask(s._id, { title: v });
            toast('Subtask renamed');
          }
          load();
        };
        input.onblur = commit;
        input.onkeydown = (e) => {
          if (e.key === 'Enter') input.blur();
          if (e.key === 'Escape') load();
        };
      };
    });
  }

  function wireHero() {
    $('#quickAdd').onsubmit = async (e) => {
      e.preventDefault();
      const title = $('#qaTitle').value.trim();
      const date = $('#qaDate').value;
      if (!title) return toast('Type a subtask first', 'error');
      if (!date) return toast('Pick a date for this subtask', 'error');
      try {
        await API.createSubtask({ task: taskId, title, date });
        $('#qaTitle').value = '';
        $('#qaDate').value = dateKey(new Date(new Date(date).getTime() + DAY_MS));
        toast('Subtask added');
        load();
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    $('#pinBtn').onclick = async () => {
      const d = await API.pinTask(taskId);
      task.pinned = d.task.pinned;
      $('#pinBtn').classList.toggle('pinned', task.pinned);
      toast(task.pinned ? 'Task pinned' : 'Task unpinned');
    };

    $('#editBtn').onclick = () => window.openTaskModal(task);

    $('#delBtn').onclick = async () => {
      const ok = await confirmDialog({
        title: 'Move to trash?',
        body: 'You can restore this task from the Trash at any time.',
        confirmText: 'Move to trash',
        danger: true,
      });
      if (!ok) return;
      await API.deleteTask(taskId);
      toast('Task moved to trash');
      setTimeout(() => (location.href = 'tasks.html?view=all'), 400);
    };

    $('#saveNotes').onclick = async () => {
      await API.updateTask(taskId, { notes: $('#notesBox').value });
      toast('Notes saved');
    };
  }

  load();
})();
