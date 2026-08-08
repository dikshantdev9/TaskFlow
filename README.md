# TaskFlow — Smart Task & Progress Management

A full-stack productivity application. Create a main task, break it into **date-wise subtasks**, tick them off, and TaskFlow computes your completion percentage automatically.

> 5 subtasks · 3 completed → **Progress = 60%**

Every account is fully isolated: each task, subtask and category is written with the owner's user id, and every read query filters by it.

---

## Stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | HTML5 · CSS3 · Vanilla JavaScript (no framework)       |
| Backend   | Node.js · Express 5                                    |
| Database  | MongoDB · Mongoose                                     |
| Auth      | JWT (`jsonwebtoken`) + `bcryptjs` password hashing     |
| Charts    | Hand-written inline SVG (no chart library)             |
| Fonts     | Satoshi (Fontshare) · JetBrains Mono (Google Fonts)    |

---

## Features

**Core**
- Email + password signup / login / logout, JWT sessions (30-day expiry)
- Per-user data isolation on every single query
- Main tasks with description, priority, category, tags, colour, start/due date, notes
- Date-wise subtasks grouped into a vertical timeline
- Automatic progress = completed subtasks ÷ total subtasks × 100, shown as a bar and a ring
- Permanent MongoDB storage — log out, come back, everything is still there

**Productivity**
- Daily productivity streak (current + longest)
- Month calendar showing every subtask, day by day
- Weekly & monthly analytics: completion rate, trend, activity heatmap, best weekday, per-category and per-priority breakdowns
- Search across titles, descriptions and tags
- Filter by priority, status, category and tag; sort by pinned, due date, progress, priority, title or age
- Tags and custom colour-coded categories
- Task reminders
- Pin important tasks
- Trash with restore and permanent delete
- Completed task history
- Dark / light / system theme, compact mode, week-start preference
- In-app notification bell (due-soon, daily digest, streak reminder)
- Toast notifications for every action
- Full JSON data export, account deletion
- Mobile responsive with a slide-in navigation drawer

---

## UI pages

| File             | Page          | What it shows                                                                                          |
| ---------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `index.html`     | Login         | Split hero + sign-in form, demo-account button                                                          |
| `signup.html`    | Signup        | Account creation                                                                                        |
| `dashboard.html` | Dashboard     | Greeting, 5 stat cards, today's tasks, completion ring, weekly bar chart, priority donut, upcoming, recent tasks |
| `tasks.html`     | My Tasks      | Card grid + toolbar. Drives **My Tasks / Today / Completed / Trash / Categories** through `?view=`      |
| `task.html`      | Task detail   | Task hero, progress ring, date-wise subtask timeline, quick-add, details panel, notes                   |
| `calendar.html`  | Calendar      | Month grid of subtasks, click a day to see its list                                                     |
| `analytics.html` | Analytics     | Completion rate, trend chart, activity heatmap, weekday chart, category donut, priority table           |
| `profile.html`   | Profile       | Avatar, account details, password change, lifetime stats, data export                                   |
| `settings.html`  | Settings      | Theme, compact mode, week start, notification toggles, danger zone                                      |

`tasks.html` is one extra page beyond the original plan — a single controller serving five sidebar views is far less code than five near-identical pages.

---

## Database structure

**User** — `name`, `email` (unique, lowercase), `password` (bcrypt hash), `bio`, `avatarColor`, `timezone`, `settings { theme, compact, weekStart, notifyDueSoon, notifyDigest, notifyStreak }`, `streak { current, longest, lastActiveDate }`, timestamps

**Task** — `user` → User, `title`, `description`, `priority` (`low|medium|high|urgent`), `category` → Category, `tags[]`, `color`, `startDate`, `dueDate`, `completed`, `completedAt`, `pinned`, `notes`, `deleted`, `deletedAt`, timestamps

**Subtask** — `user` → User, `task` → Task, `title`, `date`, `completed`, `completedAt`, `order`, timestamps

**Category** — `user` → User, `name`, `color`. Unique on `(user, name)`.

**Reminder** — `user` → User, `task` → Task, `remindAt`, `message`, `sent`

Indexes on `(user, deleted)`, `(user, dueDate)`, `(user, task)` and `(user, date)` keep every per-user query fast.

---

## API structure

Everything below `/api/auth` requires the `Authorization: Bearer <token>` header.

**Auth**
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

**Tasks**
```
GET    /api/tasks                     ?search &priority &status &category &tag &view &sort &trash
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id                 soft delete → trash
PATCH  /api/tasks/:id/pin
PATCH  /api/tasks/:id/restore
DELETE /api/tasks/:id/permanent
DELETE /api/tasks/trash/empty
GET    /api/tasks/stats/overview
GET    /api/tasks/stats/analytics     ?range=7|30|90
GET    /api/tasks/stats/calendar      ?year &month
GET    /api/tasks/meta/categories
POST   /api/tasks/meta/categories
DELETE /api/tasks/meta/categories/:id
GET    /api/tasks/meta/tags
GET    /api/tasks/meta/reminders
POST   /api/tasks/meta/reminders
```

**Subtasks**
```
GET    /api/subtasks/task/:taskId
POST   /api/subtasks
POST   /api/subtasks/bulk
PUT    /api/subtasks/:id
PATCH  /api/subtasks/:id/toggle
DELETE /api/subtasks/:id
```

**User**
```
GET    /api/users/profile
PUT    /api/users/profile
PUT    /api/users/password
PUT    /api/users/settings
GET    /api/users/export
DELETE /api/users/account
```

---

## Folder structure

```
TaskFlow/
├── frontend/
│   ├── index.html            login
│   ├── signup.html
│   ├── dashboard.html
│   ├── tasks.html            My Tasks / Today / Completed / Trash / Categories
│   ├── task.html             single task + subtasks
│   ├── calendar.html
│   ├── analytics.html
│   ├── profile.html
│   ├── settings.html
│   ├── css/
│   │   ├── style.css         design tokens, base, buttons, cards, modals
│   │   ├── login.css         auth pages
│   │   ├── dashboard.css     shell, sidebar, stats, charts
│   │   ├── task.css          task detail + subtask timeline
│   │   ├── calendar.css      month grid
│   │   └── responsive.css    tablet, mobile, print
│   ├── js/
│   │   ├── api.js            fetch wrapper, token store, all endpoints
│   │   ├── utils.js          icons, dates, shell, modals, toasts, SVG charts
│   │   ├── auth.js           login + signup
│   │   ├── dashboard.js
│   │   ├── tasks.js          task list, filters, task modal
│   │   ├── subtasks.js       task detail page
│   │   ├── calendar.js
│   │   ├── analytics.js
│   │   ├── profile.js
│   │   └── settings.js
│   └── assets/{images,icons}
├── backend/
│   ├── config/db.js
│   ├── models/{User,Task,Subtask,Category,Reminder}.js
│   ├── controllers/{auth,task,subtask,user}Controller.js
│   ├── routes/{auth,task,subtask,user}Routes.js
│   ├── middleware/{auth,error}Middleware.js
│   ├── utils/calculateProgress.js
│   ├── seed.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

---

## Running it

```bash
cd backend
npm install
cp .env.example .env      # then edit
node server.js
```

Open <http://localhost:5000> — Express serves the `frontend/` folder statically, so there is no second server to start.


## How progress is calculated

`backend/utils/calculateProgress.js` is the single source of truth:

```js
progress = total === 0 ? 0 : Math.round((completed / total) * 100);
```

It runs server-side on every task read, so the number in the ring, the bar, the card and the dashboard can never drift apart.
