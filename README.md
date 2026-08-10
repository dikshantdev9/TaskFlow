# 🚀 TaskFlow — Smart Task & Progress Management

**TaskFlow** is a full-stack productivity and task management application that helps users organize their work into main tasks and **date-wise subtasks**, track completion, monitor productivity, and analyze progress over time.

> **5 subtasks · 3 completed → Progress = 60%**

Every user's data is isolated using their authenticated user ID. Tasks, subtasks, categories, reminders, and other user-specific data are queried and stored with ownership checks.

---

## ✨ Features

### 🔐 Authentication & Security

* Email + password signup
* Secure password hashing using `bcryptjs`
* JWT-based authentication
* 30-day JWT session expiry
* Login / logout functionality
* Protected API routes
* User-specific data isolation
* Account deletion
* Password change
* Secure environment variable configuration
* Real `.env` files excluded from Git

### 📋 Task Management

* Create, edit, and delete tasks
* Task descriptions
* Priority levels:

  * Low
  * Medium
  * High
  * Urgent
* Start date and due date
* Custom task colors
* Tags
* Categories
* Task notes
* Pin important tasks
* Search tasks
* Filter tasks
* Sort tasks
* Completed task history
* Trash / restore functionality
* Permanent task deletion

### 📝 Subtask Management

Break every main task into smaller date-wise subtasks.

* Create subtasks
* Edit subtasks
* Delete subtasks
* Toggle completion
* Bulk subtask creation
* Assign subtasks to specific dates
* Vertical subtask timeline
* Automatic completion tracking

### 📊 Automatic Progress

TaskFlow calculates task progress automatically:

```text
Progress = Completed Subtasks ÷ Total Subtasks × 100
```

Example:

```text
Total subtasks     = 5
Completed subtasks = 3

Progress = (3 ÷ 5) × 100
         = 60%
```

The calculation is handled server-side through a centralized utility so the progress shown across the application remains consistent.

### 📈 Productivity Analytics

* Current productivity streak
* Longest productivity streak
* Weekly analytics
* Monthly analytics
* Completion rate
* Completion trend
* Activity heatmap
* Best weekday
* Category breakdown
* Priority breakdown
* Productivity statistics

### 📅 Calendar

* Monthly calendar
* Date-wise subtask display
* View subtasks for a selected date
* Track upcoming work
* Track completed activities

### 🔔 Notifications & Reminders

* Task reminders
* Due-soon notifications
* Daily digest
* Streak reminders
* In-app notification bell
* Toast notifications for user actions

### 🎨 Personalization

* Dark theme
* Light theme
* System theme
* Compact mode
* Week-start preference
* Custom category colors
* Custom task colors

### 📦 Data Management

* Full JSON data export
* Account deletion
* Trash and restore
* Permanent deletion

### 📱 Responsive Design

TaskFlow is designed to work across:

* Desktop
* Laptop
* Tablet
* Mobile

Mobile users get a slide-in navigation drawer for easier navigation.

---

# 🛠️ Tech Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Frontend         | HTML5, CSS3, Vanilla JavaScript |
| Backend          | Node.js, Express 5              |
| Database         | MongoDB                         |
| ODM              | Mongoose                        |
| Authentication   | JWT                             |
| Password Hashing | bcryptjs                        |
| Charts           | Inline SVG                      |
| Fonts            | Satoshi, JetBrains Mono         |
| Development      | Node.js / npm                   |
| Version Control  | Git / GitHub                    |

No frontend framework is used. The frontend is built using **pure HTML, CSS, and JavaScript**.

---

# 🖥️ Application Pages

| File             | Page        | Description                                   |
| ---------------- | ----------- | --------------------------------------------- |
| `index.html`     | Login       | User login and demo account access            |
| `signup.html`    | Signup      | New account creation                          |
| `dashboard.html` | Dashboard   | Productivity overview and statistics          |
| `tasks.html`     | My Tasks    | Tasks, Today, Completed, Trash and Categories |
| `task.html`      | Task Detail | Task information and subtask timeline         |
| `calendar.html`  | Calendar    | Monthly subtask calendar                      |
| `analytics.html` | Analytics   | Productivity analytics and charts             |
| `profile.html`   | Profile     | Account information and data management       |
| `settings.html`  | Settings    | Theme, notifications and preferences          |

### `tasks.html`

Instead of creating separate pages for every task view, TaskFlow uses a single controller page:

```text
tasks.html?view=my
tasks.html?view=today
tasks.html?view=completed
tasks.html?view=trash
tasks.html?view=categories
```

This keeps the frontend smaller and avoids unnecessary duplicate pages.

---

# 📊 Dashboard

The dashboard provides a quick overview of productivity.

It includes:

* Greeting
* Total tasks
* Completed tasks
* Pending tasks
* Today's tasks
* Completion percentage
* Completion ring
* Weekly activity chart
* Priority breakdown
* Upcoming tasks
* Recent tasks
* Productivity streak

---

# 🗂️ Task Structure

A main task can contain multiple date-wise subtasks.

Example:

```text
Main Task
│
├── 08 Aug
│   ├── Learn HTML ✓
│   └── Learn CSS ✓
│
├── 09 Aug
│   ├── Learn JavaScript ✓
│   └── Build webpage
│
└── 10 Aug
    └── Test project
```

Progress is calculated from the subtasks.

```text
5 total subtasks
3 completed

Progress = 60%
```

---

# 🗄️ Database Structure

TaskFlow uses MongoDB with Mongoose.

## User

```text
User
├── name
├── email
├── password
├── bio
├── avatarColor
├── timezone
├── settings
│   ├── theme
│   ├── compact
│   ├── weekStart
│   ├── notifyDueSoon
│   ├── notifyDigest
│   └── notifyStreak
├── streak
│   ├── current
│   ├── longest
│   └── lastActiveDate
└── timestamps
```

## Task

```text
Task
├── user
├── title
├── description
├── priority
├── category
├── tags[]
├── color
├── startDate
├── dueDate
├── completed
├── completedAt
├── pinned
├── notes
├── deleted
├── deletedAt
└── timestamps
```

## Subtask

```text
Subtask
├── user
├── task
├── title
├── date
├── completed
├── completedAt
├── order
└── timestamps
```

## Category

```text
Category
├── user
├── name
├── color
└── unique(user, name)
```

## Reminder

```text
Reminder
├── user
├── task
├── remindAt
├── message
├── sent
└── timestamps
```

---

# 🔒 Data Isolation

TaskFlow is designed so that one user's data cannot be accessed through another user's authenticated account.

User-owned records contain a reference to the authenticated user:

```text
user → User
```

Protected queries are scoped using the authenticated user's ID.

Conceptually:

```js
{
  user: req.user.id
}
```

This ownership check is applied when reading and modifying user-specific resources.

The application therefore maintains separate task, subtask, category, and reminder data for each account.

---

# 🌐 API Documentation

Protected API endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Authentication

```http
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Signup

```http
POST /api/auth/signup
```

### Login

```http
POST /api/auth/login
```

### Logout

```http
POST /api/auth/logout
```

### Current User

```http
GET /api/auth/me
```

---

# 📋 Task API

```http
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/pin
PATCH  /api/tasks/:id/restore
DELETE /api/tasks/:id/permanent
DELETE /api/tasks/trash/empty
```

## Task Query Parameters

The task listing endpoint supports filters such as:

```text
search
priority
status
category
tag
view
sort
trash
```

Example:

```http
GET /api/tasks?priority=high
```

---

# 📊 Task Statistics API

```http
GET /api/tasks/stats/overview
GET /api/tasks/stats/analytics?range=7
GET /api/tasks/stats/analytics?range=30
GET /api/tasks/stats/analytics?range=90
GET /api/tasks/stats/calendar?year=2026&month=8
```

---

# 🏷️ Category & Metadata API

```http
GET    /api/tasks/meta/categories
POST   /api/tasks/meta/categories
DELETE /api/tasks/meta/categories/:id

GET    /api/tasks/meta/tags

GET    /api/tasks/meta/reminders
POST   /api/tasks/meta/reminders
```

---

# 📝 Subtask API

```http
GET    /api/subtasks/task/:taskId
POST   /api/subtasks
POST   /api/subtasks/bulk
PUT    /api/subtasks/:id
PATCH  /api/subtasks/:id/toggle
DELETE /api/subtasks/:id
```

---

# 👤 User API

```http
GET    /api/users/profile
PUT    /api/users/profile
PUT    /api/users/password
PUT    /api/users/settings
GET    /api/users/export
DELETE /api/users/account
```

---

# 📁 Project Structure

```text
TaskFlow/
│
├── frontend/
│   ├── index.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── tasks.html
│   ├── task.html
│   ├── calendar.html
│   ├── analytics.html
│   ├── profile.html
│   ├── settings.html
│   │
│   ├── css/
│   │   ├── style.css
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   ├── task.css
│   │   ├── calendar.css
│   │   └── responsive.css
│   │
│   ├── js/
│   │   ├── api.js
│   │   ├── utils.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── tasks.js
│   │   ├── subtasks.js
│   │   ├── calendar.js
│   │   ├── analytics.js
│   │   ├── profile.js
│   │   └── settings.js
│   │
│   └── assets/
│       ├── images/
│       └── icons/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Subtask.js
│   │   ├── Category.js
│   │   └── Reminder.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   ├── subtaskController.js
│   │   └── userController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── subtaskRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   │
│   ├── utils/
│   │   └── calculateProgress.js
│   │
│   ├── seed.js
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/TaskFlow.git
```

Then:

```bash
cd TaskFlow
```

---

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
USE_MEMORY_DB=false
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=30d
SEED_DEMO=false
```

### Environment Variables

| Variable         | Description                     |
| ---------------- | ------------------------------- |
| `PORT`           | Backend server port             |
| `MONGO_URI`      | MongoDB connection string       |
| `USE_MEMORY_DB`  | Use temporary in-memory MongoDB |
| `JWT_SECRET`     | Secret used to sign JWT tokens  |
| `JWT_EXPIRES_IN` | JWT expiration time             |
| `SEED_DEMO`      | Enable demo data seeding        |

---

# 🗃️ MongoDB Configuration

TaskFlow supports both a real MongoDB database and an in-memory database.

## Option 1 — Local MongoDB

Install MongoDB locally and use:

```env
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
USE_MEMORY_DB=false
```

Data will persist between server restarts.

---

## Option 2 — MongoDB Atlas

You can use a MongoDB Atlas connection string:

```env
MONGO_URI=<YOUR_MONGODB_ATLAS_CONNECTION_STRING>
USE_MEMORY_DB=false
```

**Never commit a real Atlas connection string containing credentials to GitHub.**

---

## Option 3 — In-Memory MongoDB

If MongoDB is not installed:

```env
USE_MEMORY_DB=true
```

The application can start an in-process MongoDB instance for development/testing.

> ⚠️ In-memory database data is temporary and will be lost when the server process stops.

---

# 🌱 Demo Data

To seed demo data, set:

```env
SEED_DEMO=true
```

The demo account is:

```text
Email:    demo@taskflow.app
Password: demo1234
```

This account is intended only for local/demo usage.

For production deployments, use your own account and disable demo seeding:

```env
SEED_DEMO=false
```

---

# ▶️ Running the Application

From the `backend` directory:

```bash
node server.js
```

The Express server serves the frontend files as static files.

Open:

```text
http://localhost:5000
```

You do **not** need to start a separate frontend server.

---

# 🔐 Environment & Git Security

Never commit your real `.env` file.

Your repository should contain:

```text
backend/.env.example
```

but should **not** contain:

```text
backend/.env
```

Example `.gitignore`:

```gitignore
node_modules/
.env
.env.*
!.env.example

*.log

.DS_Store
Thumbs.db
```

> Keep real secrets, database credentials, API keys, and JWT secrets outside Git.

If a secret is accidentally pushed to GitHub, simply deleting the file is **not enough** because it may remain in Git history. Rotate/revoke the exposed credential immediately.

---

# 📈 Progress Calculation

TaskFlow uses a centralized utility:

```text
backend/utils/calculateProgress.js
```

The calculation is:

```js
progress = total === 0
  ? 0
  : Math.round((completed / total) * 100);
```

Example:

```text
Total subtasks     = 10
Completed subtasks = 7

Progress = (7 / 10) × 100
         = 70%
```

The server calculates progress when task data is processed, keeping the progress value consistent across:

* Task cards
* Task detail page
* Progress bar
* Progress ring
* Dashboard
* Analytics

---

# 🔎 Search & Filtering

TaskFlow supports searching and filtering tasks using:

### Search

```text
Title
Description
Tags
```

### Filters

```text
Priority
Status
Category
Tag
```

### Sorting

```text
Pinned
Due date
Progress
Priority
Title
Age
```

---

# 🗑️ Trash System

Deleting a task initially performs a **soft delete**.

The task is moved to Trash instead of being immediately destroyed.

Available operations:

```http
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/restore
DELETE /api/tasks/:id/permanent
DELETE /api/tasks/trash/empty
```

This provides an additional safety layer against accidental deletion.

---

# 📊 Analytics

The analytics dashboard provides:

* Completion rate
* Completion trend
* Activity heatmap
* Best weekday
* Category performance
* Priority breakdown
* Weekly statistics
* Monthly statistics

Supported ranges:

```text
7 days
30 days
90 days
```

---

# 📅 Calendar

The calendar provides a monthly view of scheduled subtasks.

Users can:

* Navigate between months
* View subtasks by date
* Identify busy days
* Open a day's subtask list
* Track completed activities

---

# 🎨 UI & Design

TaskFlow uses a modern productivity-focused interface.

### Design Features

* Clean dashboard layout
* Responsive cards
* Progress rings
* SVG charts
* Task timeline
* Modal dialogs
* Toast notifications
* Dark / light themes
* Mobile navigation drawer
* Compact mode

### Fonts

* **Satoshi** — primary interface font
* **JetBrains Mono** — technical/monospace elements

---

# 📱 Responsive Design

The interface adapts to different screen sizes:

```text
Desktop
   ↓
Laptop
   ↓
Tablet
   ↓
Mobile
```

On smaller screens, the sidebar transforms into a slide-in navigation drawer.

---

# 🧪 Development

Install dependencies:

```bash
cd backend
npm install
```

Start the server:

```bash
node server.js
```

Then open:

```text
http://localhost:5000
```

---

# 🛡️ Security Considerations

TaskFlow implements several basic security practices:

* Password hashing using `bcryptjs`
* JWT authentication
* Protected routes
* User ownership checks
* MongoDB/Mongoose validation
* Environment-based secrets
* `.env` excluded from Git
* Soft-delete functionality
* Account deletion
* Per-user database queries

For production deployment, additional protections such as rate limiting, secure cookies, HTTPS, stronger validation, security headers, and centralized secret management should also be considered.

---

# 🚀 Production Deployment

Before deploying TaskFlow:

### Backend

Configure:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=<YOUR_SECURE_DATABASE_URL>
JWT_SECRET=<YOUR_LONG_RANDOM_SECRET>
JWT_EXPIRES_IN=30d
USE_MEMORY_DB=false
SEED_DEMO=false
```

### Important

Do not use:

```env
JWT_SECRET=change_me_to_a_long_random_string
```

in production.

Generate a strong random secret instead.

Never expose:

* MongoDB passwords
* JWT secrets
* API keys
* Private credentials
* Real `.env` files

in the public repository.

---

# 🧩 Future Improvements

Possible future enhancements include:

* Email notifications
* Push notifications
* OAuth login
* Google authentication
* Two-factor authentication
* Recurring tasks
* Drag-and-drop task ordering
* Advanced reminder scheduling
* PWA support
* Offline mode
* Real-time synchronization
* Team collaboration
* Shared tasks
* Task comments
* File attachments
* AI task suggestions
* AI productivity insights

---

# 📌 Project Goals

TaskFlow was designed to demonstrate practical full-stack development concepts including:

* REST API development
* Authentication and authorization
* MongoDB data modeling
* Mongoose relationships
* CRUD operations
* User data isolation
* Frontend-backend integration
* JWT authentication
* Password hashing
* Responsive UI design
* Data visualization
* Productivity analytics
* Environment configuration
* Git/GitHub project management

---

# 👨‍💻 Author

**Dikshant Gaikwad**

Computer Engineering Student
Full-Stack Development | Python | JavaScript | MongoDB

---

# 📄 License

This project is intended for educational and portfolio purposes.

Add an appropriate open-source license if you plan to distribute or reuse the project publicly.

---

## ⭐ If You Like This Project

If you find TaskFlow useful or interesting, consider giving the repository a ⭐ on GitHub.

```text
TaskFlow
Smart Tasks • Subtasks • Progress • Productivity • Analytics
```
