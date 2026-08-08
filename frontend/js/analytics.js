/* ============================================================
   analytics.js — weekly / monthly productivity analytics
   ============================================================ */
(async function () {
  const user = await requireAuth();
  if (!user) return;

  const page = renderShell({
    active: 'analytics',
    title: 'Analytics',
    subtitle: 'How your effort actually distributes over time',
    search: false,
    actions: `<select class="select select-sm" id="rangeSel" aria-label="Date range">
        <option value="7">Last 7 days</option>
        <option value="30" selected>Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="365">Last year</option>
      </select>`,
  });

  page.innerHTML = `<div class="stat-grid">${'<div class="skeleton" style="height:148px;border-radius:var(--radius-xl)"></div>'.repeat(4)}</div>
    <div class="skeleton mt-5" style="height:300px;border-radius:var(--radius-xl)"></div>`;

  $('#rangeSel').onchange = (e) => load(Number(e.target.value));

  async function load(range) {
    let a;
    try {
      ({ analytics: a } = await API.analytics(range));
    } catch (err) {
      page.innerHTML = emptyState('alert', 'Could not load analytics', err.message);
      return;
    }

    /* weekly buckets for the trend chart (keeps bars readable on long ranges) */
    const trend = bucket(a.series, range);
    const catTotal = a.byCategory.reduce((n, c) => n + c.total, 0);

    page.innerHTML = `
      <div class="stat-grid">
        ${stat('Completion rate', `${a.completionRate}<span class="unit">%</span>`, 'target', 'emerald', `of subtasks scheduled in the last ${a.range} days`)}
        ${stat('Subtasks completed', a.totalCompleted, 'completed', 'sky', `${a.dailyAverage} per day on average`)}
        ${stat('Current streak', `${a.streak.current}<span class="unit">days</span>`, 'flame', 'amber', `Longest ever: ${a.streak.longest} days`)}
        ${stat('Best day', a.bestDay.completed ? `${a.bestDay.completed}` : '0', 'zap', 'rose', a.bestDay.date ? `${fmtDate(a.bestDay.date)} — your most productive day` : 'No completions yet')}
      </div>

      <div class="dash-grid">
        <div class="dash-col">
          <section class="card">
            <div class="card-head"><h2 class="card-title">${icon('analytics', 16)} Completion trend</h2>
              <span class="text-xs faint">${trend.caption}</span></div>
            <div class="chart-wrap">${Charts.bars(trend.data)}</div>
          </section>

          <section class="card">
            <div class="card-head"><h2 class="card-title">${icon('activity', 16)} Daily activity</h2>
              <span class="text-xs faint">Last ${Math.min(a.range, 182)} days</span></div>
            <div class="card-pad">
              ${Charts.heatmap(a.series.slice(-182))}
              <div class="legend mt-4" style="flex-direction:row;align-items:center;gap:var(--space-2)">
                <span class="text-xs faint">Less</span>
                ${[0, 1, 2, 3, 4].map((l) => `<span class="heat-cell heat-${l}" style="width:12px;height:12px"></span>`).join('')}
                <span class="text-xs faint">More</span>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-head"><h2 class="card-title">${icon('today', 16)} Most productive weekday</h2></div>
            <div class="chart-wrap">${Charts.bars(a.byWeekday.map((w) => ({ label: w.label, value: w.completed })))}</div>
          </section>
        </div>

        <div class="dash-col">
          <section class="card">
            <div class="card-head"><h2 class="card-title">${icon('folder', 16)} Tasks by category</h2></div>
            <div class="card-pad donut-wrap">
              ${Charts.donut(
                a.byCategory.map((c) => ({ label: c.name, value: c.total, color: c.color })),
                { size: 132, thickness: 16, centerValue: catTotal, centerLabel: 'tasks' }
              )}
              <div class="legend">
                ${a.byCategory
                  .map(
                    (c) => `<div class="legend-item">
                      <span class="legend-swatch" style="background:${esc(c.color)}"></span>
                      <span class="grow">${esc(c.name)}</span>
                      <span class="mono strong">${c.completed}/${c.total}</span>
                    </div>`
                  )
                  .join('') || '<span class="text-sm faint">No categories yet.</span>'}
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-head"><h2 class="card-title">${icon('zap', 16)} By priority</h2></div>
            <div class="card-pad">
              ${a.byPriority
                .map((p) => {
                  const pct = p.total ? Math.round((p.completed / p.total) * 100) : 0;
                  return `<div class="mb-4">
                    <div class="row-between text-xs mb-2">
                      <span>${priorityBadge(p.priority)}</span>
                      <span class="mono strong">${p.completed}/${p.total} · ${pct}%</span>
                    </div>
                    <div class="progress progress-sm"><div class="progress-fill" style="width:${pct}%;background:var(--p-${p.priority})"></div></div>
                  </div>`;
                })
                .join('')}
            </div>
          </section>

          <section class="card">
            <div class="card-head"><h2 class="card-title">${icon('info', 16)} Summary</h2></div>
            <div class="detail-list">
              <div class="detail-item"><span class="k">Range</span><span class="v">Last ${a.range} days</span></div>
              <div class="detail-item"><span class="k">Subtasks scheduled</span><span class="v">${a.series.reduce((n, s) => n + s.scheduled, 0)}</span></div>
              <div class="detail-item"><span class="k">Subtasks completed</span><span class="v">${a.totalCompleted}</span></div>
              <div class="detail-item"><span class="k">Daily average</span><span class="v">${a.dailyAverage}</span></div>
              <div class="detail-item"><span class="k">Active days</span><span class="v">${a.series.filter((s) => s.completed > 0).length}</span></div>
            </div>
          </section>
        </div>
      </div>`;
  }

  function stat(label, value, ic, tone, meta) {
    return `<div class="stat">
      <div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${tone} ${ic === 'flame' ? 'flame' : ''}">${icon(ic, 16)}</span></div>
      <div class="stat-value">${value}</div>
      <div class="stat-meta">${esc(meta)}</div>
    </div>`;
  }

  /** Collapse a daily series into readable buckets. */
  function bucket(series, range) {
    if (range <= 14) {
      return {
        caption: 'Subtasks completed per day',
        data: series.map((s) => ({ label: new Date(s.date).toLocaleDateString('en-US', { weekday: 'narrow' }), value: s.completed })),
      };
    }
    const size = range <= 90 ? 7 : 30;
    const out = [];
    for (let i = 0; i < series.length; i += size) {
      const chunk = series.slice(i, i + size);
      out.push({
        label: fmtShort(chunk[0].date).replace(' ', '\u00a0'),
        value: chunk.reduce((n, s) => n + s.completed, 0),
      });
    }
    return { caption: size === 7 ? 'Completed per week' : 'Completed per month', data: out.slice(-14) };
  }

  load(30);
})();
