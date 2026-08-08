/* ============================================================
   tasks.js — shared task modal + task cards + My Tasks page
   Included on: dashboard, tasks, calendar, task detail
   ============================================================ */

/* ---------------------------------------------- shared state */
const TaskStore = {
  categories: [],
  tags: [],
  async loadMeta() {
    const [c, t] = await Promise.all([API.categories(), API.tags()]);
    TaskStore.categories = c.categories;
    TaskStore.tags = t.tags;
  },
};

/* ------------------------------------------------- task card */
function taskCard(t) {
  const cat = t.category;
  const done = t.status === 'completed';
  const over = !done && isOverdue(t.dueDate);
  return `<article class="task-card ${done ? 'completed' : ''}" style="--accent:${esc(t.color || '#0F7A52')}" data-task="${t._id}" tabindex="0" role="link" aria-label="Open ${esc(t.title)}">
      <div class="task-card-head">
        <h3 class="task-card-title grow">${esc(t.title)}</h3>
        <button class="pin-btn ${t.pinned ? 'pinned' : ''}" data-pin="${t._id}" aria-label="${t.pinned ? 'Unpin task' : 'Pin task'}" title="Pin task">${icon('pin', 15)}</button>
      </div>
      ${t.description ? `<p class="task-card-desc">${esc(t.description)}</p>` : ''}
      <div class="task-card-meta">
        ${priorityBadge(t.priority)}
        ${cat ? `<span class="badge badge-soft">${esc(cat.name)}</span>` : ''}
        ${done ? `<span class="badge badge-primary">${icon('check', 12)} Completed</span>` : ''}
        ${(t.tags || []).slice(0, 2).map((tag) => `<span class="tag">#${esc(tag)}</span>`).join('')}
      </div>
      <div class="progress ${t.progress === 100 ? 'is-done' : ''}"><div class="progress-fill" style="width:${t.progress}%"></div></div>
      <div class="task-card-foot">
        <span class="meta-inline">${icon('completed', 13)} ${t.completedCount}/${t.subtaskCount} subtasks</span>
        <span class="pct">${t.progress}%</span>
      </div>
      <div class="task-card-foot">
        <span class="meta-inline ${over ? 'overdue' : ''}">${icon('calendar', 13)} ${t.dueDate ? `${over ? 'Overdue · ' : ''}${fmtShort(t.dueDate)}` : 'No due date'}</span>
        <span class="faint text-xs">${relDate(t.dueDate)}</span>
      </div>
    </article>`;
}

function trashCard(t) {
  return `<article class="task-card" style="--accent:var(--text-faint);cursor:default" data-trash="${t._id}">
      <div class="task-card-head"><h3 class="task-card-title grow">${esc(t.title)}</h3></div>
      <div class="task-card-meta">${priorityBadge(t.priority)}<span class="badge badge-soft">Deleted ${relDate(t.deletedAt).toLowerCase()}</span></div>
      <div class="task-card-foot" style="justify-content:flex-start;gap:var(--space-2)">
        <button class="btn btn-secondary btn-sm" data-restore="${t._id}">${icon('restore', 14)} Restore</button>
        <button class="btn btn-ghost btn-sm" data-destroy="${t._id}" style="color:var(--rose)">${icon('trash', 14)} Delete forever</button>
      </div>
    </article>`;
}

function wireTaskCards(root, onChange) {
  $$('[data-task]', root).forEach((card) => {
    const go = (e) => {
      if (e.target.closest('[data-pin]')) return;
      location.href = `task.html?id=${card.dataset.task}`;
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') go(e);
    });
  });
  $$('[data-pin]', root).forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const { task } = await API.pinTask(btn.dataset.pin);
        btn.classList.toggle('pinned', task.pinned);
        toast(task.pinned ? 'Task pinned' : 'Task unpinned');
        if (onChange) onChange();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

/* ------------------------------------------- create/edit modal */
const TASK_COLORS = ['#0F7A52', '#0369A1', '#B45309', '#BE123C', '#6D28D9', '#0E7490', '#4D7C0F', '#9D174D'];

function taskModalHTML() {
  return `
  <div class="modal-backdrop" id="taskModal" aria-hidden="true">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="taskModalTitle">
      <div class="modal-head">
        <h2 id="taskModalTitle">New task</h2>
        <button class="icon-btn" data-close-modal="taskModal" aria-label="Close">${icon('x', 18)}</button>
      </div>
      <form id="taskForm">
        <div class="modal-body">
          <input type="hidden" id="tfId" />

          <div class="field">
            <label class="label" for="tfTitle">Task title</label>
            <input class="input" id="tfTitle" placeholder="e.g. Learn Full Stack Development" required />
          </div>

          <div class="field mt-4">
            <label class="label" for="tfDesc">Description</label>
            <textarea class="textarea" id="tfDesc" rows="2" placeholder="What does finishing this look like?"></textarea>
          </div>

          <div class="form-grid mt-4">
            <div class="field">
              <label class="label" for="tfPriority">Priority</label>
              <select class="select" id="tfPriority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div class="field">
              <label class="label" for="tfCategory">Category</label>
              <select class="select" id="tfCategory"><option value="">No category</option></select>
            </div>
            <div class="field">
              <label class="label" for="tfStart">Start date</label>
              <input class="input" type="date" id="tfStart" />
            </div>
            <div class="field">
              <label class="label" for="tfDue">Due date</label>
              <input class="input" type="date" id="tfDue" />
            </div>
          </div>

          <div class="field mt-4">
            <label class="label">Tags</label>
            <div class="tag-input-wrap" id="tfTagWrap">
              <input id="tfTagInput" placeholder="Type a tag and press Enter" aria-label="Add tag" />
            </div>
            <span class="field-hint">Tags make search and filtering much faster.</span>
          </div>

          <div class="field mt-4">
            <label class="label">Accent colour</label>
            <div class="color-picker" id="tfColors">
              ${TASK_COLORS.map((c, i) => `<button type="button" class="swatch ${i === 0 ? 'selected' : ''}" data-color="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}
            </div>
          </div>

          <div class="field mt-6" id="tfSubtaskBlock">
            <label class="label">Date-wise subtasks</label>
            <span class="field-hint" style="margin-bottom:var(--space-3);display:block">Break the task into daily steps. Progress = completed ÷ total.</span>
            <div class="draft-list" id="tfDrafts"></div>
            <button type="button" class="btn btn-secondary btn-sm mt-2" id="tfAddDraft">${icon('plus', 14)} Add subtask</button>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-secondary" data-close-modal="taskModal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="tfSubmit">Create task</button>
        </div>
      </form>
    </div>
  </div>`;
}

const TaskModal = {
  tags: [],
  color: TASK_COLORS[0],
  editing: null,
  onSaved: null,

  mount(onSaved) {
    if (!document.getElementById('taskModal')) {
      document.body.insertAdjacentHTML('beforeend', taskModalHTML());
      wireModals();
      TaskModal.wire();
    }
    TaskModal.onSaved = onSaved || null;
  },

  renderTags() {
    const wrap = $('#tfTagWrap');
    $$('.tag', wrap).forEach((t) => t.remove());
    const input = $('#tfTagInput');
    TaskModal.tags.forEach((t) => {
      const el = document.createElement('span');
      el.className = 'tag';
      el.innerHTML = `#${esc(t)}<button type="button" class="tag-x" aria-label="Remove ${esc(t)}">${icon('x', 11)}</button>`;
      el.querySelector('button').onclick = () => {
        TaskModal.tags = TaskModal.tags.filter((x) => x !== t);
        TaskModal.renderTags();
      };
      wrap.insertBefore(el, input);
    });
  },

  addDraft(value = { title: '', date: '' }) {
    const list = $('#tfDrafts');
    const row = document.createElement('div');
    row.className = 'draft-row';
    row.innerHTML = `
      <input class="input draft-title" placeholder="Subtask, e.g. Learn HTML" value="${esc(value.title)}" />
      <input class="input draft-date" type="date" value="${esc(value.date)}" aria-label="Subtask date" />
      <button type="button" class="draft-del" aria-label="Remove subtask">${icon('x', 15)}</button>`;
    row.querySelector('.draft-del').onclick = () => row.remove();
    row.querySelector('.draft-title').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        TaskModal.addDraft({ title: '', date: nextDraftDate() });
      }
    });
    list.appendChild(row);
    return row;
  },

  wire() {
    $('#tfAddDraft').onclick = () => TaskModal.addDraft({ title: '', date: nextDraftDate() });

    $('#tfTagInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = e.target.value.trim().replace(/^#/, '');
        if (v && !TaskModal.tags.includes(v)) TaskModal.tags.push(v);
        e.target.value = '';
        TaskModal.renderTags();
      } else if (e.key === 'Backspace' && !e.target.value) {
        TaskModal.tags.pop();
        TaskModal.renderTags();
      }
    });

    $$('#tfColors .swatch').forEach((s) => {
      s.onclick = () => {
        $$('#tfColors .swatch').forEach((x) => x.classList.remove('selected'));
        s.classList.add('selected');
        TaskModal.color = s.dataset.color;
      };
    });

    $('#taskForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = $('#tfTitle').value.trim();
      if (!title) return toast('Give the task a title', 'error');

      const payload = {
        title,
        description: $('#tfDesc').value.trim(),
        priority: $('#tfPriority').value,
        category: $('#tfCategory').value || null,
        startDate: $('#tfStart').value || null,
        dueDate: $('#tfDue').value || null,
        tags: TaskModal.tags,
        color: TaskModal.color,
      };

      const btn = $('#tfSubmit');
      const label = btn.textContent;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span>Saving`;

      try {
        if (TaskModal.editing) {
          await API.updateTask(TaskModal.editing, payload);
          toast('Task updated');
        } else {
          payload.subtasks = $$('#tfDrafts .draft-row')
            .map((r) => ({ title: $('.draft-title', r).value.trim(), date: $('.draft-date', r).value }))
            .filter((s) => s.title && s.date);
          await API.createTask(payload);
          toast(payload.subtasks.length ? `Task created with ${payload.subtasks.length} subtasks` : 'Task created');
        }
        closeModal('taskModal');
        if (TaskModal.onSaved) TaskModal.onSaved();
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  },

  open(task) {
    TaskModal.editing = task ? task._id : null;
    TaskModal.tags = task ? [...(task.tags || [])] : [];
    TaskModal.color = task ? task.color || TASK_COLORS[0] : TASK_COLORS[0];

    $('#taskModalTitle').textContent = task ? 'Edit task' : 'New task';
    $('#tfSubmit').textContent = task ? 'Save changes' : 'Create task';
    $('#tfTitle').value = task ? task.title : '';
    $('#tfDesc').value = task ? task.description || '' : '';
    $('#tfPriority').value = task ? task.priority : 'medium';
    $('#tfStart').value = task && task.startDate ? dateKey(task.startDate) : '';
    $('#tfDue').value = task && task.dueDate ? dateKey(task.dueDate) : '';

    $('#tfCategory').innerHTML =
      `<option value="">No category</option>` +
      TaskStore.categories.map((c) => `<option value="${c._id}">${esc(c.name)}</option>`).join('');
    const catId = task && task.category ? task.category._id || task.category : '';
    $('#tfCategory').value = catId || '';

    $$('#tfColors .swatch').forEach((s) =>
      s.classList.toggle('selected', s.dataset.color.toLowerCase() === TaskModal.color.toLowerCase())
    );

    $('#tfSubtaskBlock').classList.toggle('hidden', !!task);
    $('#tfDrafts').innerHTML = '';
    if (!task) {
      TaskModal.addDraft({ title: '', date: todayKey() });
      TaskModal.addDraft({ title: '', date: dateKey(new Date(Date.now() + DAY_MS)) });
      TaskModal.addDraft({ title: '', date: dateKey(new Date(Date.now() + 2 * DAY_MS)) });
    }

    TaskModal.renderTags();
    openModal('taskModal');
  },
};

function nextDraftDate() {
  const rows = $$('#tfDrafts .draft-date');
  const last = rows.length ? rows[rows.length - 1].value : null;
  const base = last ? new Date(last) : new Date();
  return dateKey(new Date(base.getTime() + DAY_MS));
}

window.openTaskModal = (task) => {
  TaskModal.mount(window.__onTaskSaved);
  TaskModal.open(task);
};

/* ================================================================
   My Tasks page controller
   ================================================================ */
const VIEW_META = {
  all: { title: 'My Tasks', sub: 'Everything on your plate, newest activity first', nav: 'tasks' },
  today: { title: 'Today', sub: "Subtasks scheduled for today", nav: 'today' },
  completed: { title: 'Completed', sub: 'Your finished work — the receipts', nav: 'completed' },
  trash: { title: 'Trash', sub: 'Deleted tasks can be restored any time', nav: 'trash' },
  categories: { title: 'Categories', sub: 'Organise tasks into areas of your life', nav: 'categories' },
  pinned: { title: 'Pinned', sub: 'Your most important tasks', nav: 'tasks' },
};

async function initTasksPage() {
  const user = await requireAuth();
  if (!user) return;

  const params = new URLSearchParams(location.search);
  const view = VIEW_META[params.get('view')] ? params.get('view') : 'all';
  const meta = VIEW_META[view];

  const page = renderShell({
    active: meta.nav,
    title: meta.title,
    subtitle: meta.sub,
    search: view !== 'categories',
    actions:
      view === 'trash'
        ? `<button class="btn btn-secondary btn-sm" id="emptyTrashBtn">${icon('trash', 15)} <span class="label">Empty trash</span></button>`
        : `<button class="btn btn-primary btn-sm" id="newTaskBtn">${icon('plus', 15)} <span class="label">New task</span></button>`,
  });

  const state = { search: '', priority: 'all', status: 'all', category: 'all', sort: '-pinned' };

  await TaskStore.loadMeta();
  window.__onTaskSaved = () => {
    TaskStore.loadMeta().then(load);
  };
  TaskModal.mount(window.__onTaskSaved);

  const newBtn = $('#newTaskBtn');
  if (newBtn) newBtn.onclick = () => window.openTaskModal();

  const emptyBtn = $('#emptyTrashBtn');
  if (emptyBtn)
    emptyBtn.onclick = async () => {
      const ok = await confirmDialog({
        title: 'Empty the trash?',
        body: 'Every task in the trash — and all of its subtasks — will be permanently deleted. This cannot be undone.',
        confirmText: 'Delete permanently',
        danger: true,
      });
      if (!ok) return;
      await API.emptyTrash();
      toast('Trash emptied');
      load();
    };

  /* ---- layout ---- */
  if (view === 'categories') {
    page.innerHTML = `
      <div class="section-head">
        <h2>Your categories</h2>
        <button class="btn btn-primary btn-sm" id="addCatBtn">${icon('plus', 15)} New category</button>
      </div>
      <div class="cat-grid" id="catGrid"></div>
      <div class="card mt-6">
        <div class="card-head"><h2 class="card-title">${icon('tag', 16)} Tags in use</h2></div>
        <div class="card-pad flex wrap gap-2" id="tagCloud"></div>
      </div>`;
    return renderCategories();
  }

  page.innerHTML = `
    <div class="toolbar" id="toolbar">
      <select class="select select-sm" id="fPriority">
        <option value="all">All priorities</option>
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select class="select select-sm" id="fCategory"><option value="all">All categories</option></select>
      ${
        view === 'all'
          ? `<select class="select select-sm" id="fStatus">
               <option value="all">All statuses</option>
               <option value="active">Active</option>
               <option value="completed">Completed</option>
             </select>`
          : ''
      }
      <select class="select select-sm" id="fSort">
        <option value="-pinned">Pinned first</option>
        <option value="due">Due date</option>
        <option value="priority">Priority</option>
        <option value="progress">Progress</option>
        <option value="newest">Newest</option>
        <option value="title">A–Z</option>
      </select>
      <span class="grow"></span>
      <span class="text-xs faint" id="resultCount"></span>
    </div>
    <div id="chips" class="flex wrap gap-2 mb-4"></div>
    <div id="list"></div>`;

  $('#fCategory').innerHTML =
    `<option value="all">All categories</option>` +
    TaskStore.categories.map((c) => `<option value="${c._id}">${esc(c.name)} (${c.taskCount})</option>`).join('');

  $('#fPriority').onchange = (e) => ((state.priority = e.target.value), load());
  $('#fCategory').onchange = (e) => ((state.category = e.target.value), load());
  $('#fSort').onchange = (e) => ((state.sort = e.target.value), load());
  const fStatus = $('#fStatus');
  if (fStatus) fStatus.onchange = (e) => ((state.status = e.target.value), load());

  const search = $('#globalSearch');
  if (search)
    search.addEventListener(
      'input',
      debounce((e) => {
        state.search = e.target.value.trim();
        load();
      }, 260)
    );

  // tag chips
  $('#chips').innerHTML = TaskStore.tags
    .slice(0, 12)
    .map((t) => `<button class="chip" data-tag="${esc(t.name)}">#${esc(t.name)} <span class="faint">${t.count}</span></button>`)
    .join('');
  let activeTag = '';
  $$('#chips .chip').forEach((c) => {
    c.onclick = () => {
      const same = activeTag === c.dataset.tag;
      activeTag = same ? '' : c.dataset.tag;
      $$('#chips .chip').forEach((x) => x.classList.toggle('active', !same && x === c));
      load();
    };
  });

  async function load() {
    const list = $('#list');
    list.innerHTML = `<div class="task-grid">${'<div class="skeleton" style="height:186px;border-radius:var(--radius-xl)"></div>'.repeat(6)}</div>`;

    const q = new URLSearchParams();
    if (state.search) q.set('search', state.search);
    if (state.priority !== 'all') q.set('priority', state.priority);
    if (state.category !== 'all') q.set('category', state.category);
    if (activeTag) q.set('tag', activeTag);
    q.set('sort', state.sort);

    if (view === 'trash') q.set('trash', 'true');
    if (view === 'completed') q.set('status', 'completed');
    if (view === 'today') q.set('view', 'today');
    if (view === 'pinned') q.set('view', 'pinned');
    if (view === 'all' && state.status !== 'all') q.set('status', state.status);

    try {
      const { tasks, count } = await API.tasks(q.toString());
      $('#resultCount').textContent = `${count} task${count === 1 ? '' : 's'}`;

      if (!count) {
        const empties = {
          trash: ['trash', 'Trash is empty', 'Deleted tasks land here for safekeeping.'],
          completed: ['completed', 'Nothing completed yet', 'Tick off every subtask in a task to complete it.'],
          today: ['today', 'Nothing scheduled today', 'Add a subtask dated today to see it here.'],
        };
        const [ic, tt, bd] = empties[view] || ['tasks', 'No tasks match', 'Try clearing a filter, or create your first task.'];
        list.innerHTML = emptyState(
          ic,
          tt,
          bd,
          view === 'trash' ? '' : `<button class="btn btn-primary btn-sm mt-4" id="emptyNew">${icon('plus', 15)} New task</button>`
        );
        const en = $('#emptyNew');
        if (en) en.onclick = () => window.openTaskModal();
        return;
      }

      list.innerHTML = `<div class="task-grid">${tasks.map(view === 'trash' ? trashCard : taskCard).join('')}</div>`;

      if (view === 'trash') {
        $$('[data-restore]').forEach((b) => {
          b.onclick = async () => {
            await API.restoreTask(b.dataset.restore);
            toast('Task restored');
            load();
          };
        });
        $$('[data-destroy]').forEach((b) => {
          b.onclick = async () => {
            const ok = await confirmDialog({
              title: 'Delete forever?',
              body: 'This task and all of its subtasks will be permanently removed.',
              confirmText: 'Delete forever',
              danger: true,
            });
            if (!ok) return;
            await API.destroyTask(b.dataset.destroy);
            toast('Task deleted permanently');
            load();
          };
        });
      } else {
        wireTaskCards(list);
      }
    } catch (err) {
      list.innerHTML = emptyState('alert', 'Could not load tasks', err.message);
    }
  }

  if (params.get('new') === '1') window.openTaskModal();
  load();

  /* ---- categories view ---- */
  async function renderCategories() {
    const CAT_COLORS = ['#0F7A52', '#0369A1', '#B45309', '#BE123C', '#6D28D9', '#0E7490'];
    const draw = async () => {
      await TaskStore.loadMeta();
      $('#catGrid').innerHTML =
        TaskStore.categories
          .map(
            (c) => `<div class="cat-item">
              <span class="cat-swatch" style="background:${esc(c.color)}"></span>
              <div class="grow">
                <div class="text-sm strong">${esc(c.name)}</div>
                <div class="text-xs faint">${c.taskCount} task${c.taskCount === 1 ? '' : 's'}</div>
              </div>
              <a class="btn btn-ghost btn-sm" href="tasks.html?view=all&cat=${c._id}">View</a>
              <button class="draft-del" data-delcat="${c._id}" aria-label="Delete ${esc(c.name)}">${icon('trash', 15)}</button>
            </div>`
          )
          .join('') || emptyState('folder', 'No categories yet', 'Group tasks by area — Work, Learning, Health.');

      $$('[data-delcat]').forEach((b) => {
        b.onclick = async () => {
          const ok = await confirmDialog({
            title: 'Delete category?',
            body: 'Tasks in this category are kept — they simply become uncategorised.',
            confirmText: 'Delete category',
            danger: true,
          });
          if (!ok) return;
          await API.deleteCategory(b.dataset.delcat);
          toast('Category deleted');
          draw();
        };
      });

      $('#tagCloud').innerHTML =
        TaskStore.tags.map((t) => `<span class="tag">#${esc(t.name)} · ${t.count}</span>`).join('') ||
        `<span class="text-sm faint">No tags yet — add some when creating a task.</span>`;
    };

    $('#addCatBtn').onclick = () => {
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop open';
      wrap.innerHTML = `<div class="modal modal-sm" role="dialog" aria-modal="true">
          <div class="modal-head"><h2>New category</h2></div>
          <div class="modal-body">
            <div class="field"><label class="label" for="ncName">Name</label>
              <input class="input" id="ncName" placeholder="e.g. Side projects" /></div>
            <div class="field mt-4"><label class="label">Colour</label>
              <div class="color-picker" id="ncColors">${CAT_COLORS.map((c, i) => `<button type="button" class="swatch ${i === 0 ? 'selected' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}</div>
            </div>
          </div>
          <div class="modal-foot"><button class="btn btn-secondary" data-no>Cancel</button><button class="btn btn-primary" data-yes>Create</button></div>
        </div>`;
      document.body.appendChild(wrap);
      let color = CAT_COLORS[0];
      $$('#ncColors .swatch', wrap).forEach((s) => {
        s.onclick = () => {
          $$('#ncColors .swatch', wrap).forEach((x) => x.classList.remove('selected'));
          s.classList.add('selected');
          color = s.dataset.color;
        };
      });
      wrap.querySelector('[data-no]').onclick = () => wrap.remove();
      wrap.querySelector('[data-yes]').onclick = async () => {
        const name = $('#ncName', wrap).value.trim();
        if (!name) return toast('Name the category', 'error');
        try {
          await API.createCategory({ name, color });
          wrap.remove();
          toast('Category created');
          draw();
        } catch (err) {
          toast(err.message, 'error');
        }
      };
    };

    draw();
  }
}

if (document.body.dataset.page === 'tasks') initTasksPage();
