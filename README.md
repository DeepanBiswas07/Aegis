# Aegis

Aegis is a premium, slate-dark Agile Project Management and Workspace Collaboration platform. Built for modern software teams, Aegis brings project planning, Kanban boards, sprint execution, and team member management together in one unified, high-performance interface.

## ⚡ Features

- **Organization Portal**: Secure space for admins to manage workspaces, invite team members, and oversee all active projects.
- **Sprint Planner**: Create and track sprints, set goals, and monitor progress.
- **Interactive Kanban Board**: Drag-and-drop task workflow management (Backlog, To Do, In Progress, Review, Done) with inline priority tags and assignee filters.
- **Team Access Portal**: OTP-based secure email login for members to access their assigned projects and tasks.
- **Premium Slate-Dark UI**: Fully responsive glassmorphic design, smooth micro-animations, custom scrollbars, and optimized mobile viewport support.

---

## 🛠️ Tech Stack

- **Frontend**: React (v19), TypeScript, Vite, React Router (v7), Axios
- **Backend**: Node.js, Express, MongoDB (Mongoose), Nodemailer
- **Styling**: Modern Vanilla CSS, CSS Variables

---

## 🚀 Local Setup & Installation

Follow these steps to get a local copy of Aegis running:

### 1. Clone the Repository
```bash
git clone https://github.com/DeepanBiswas07/Aegis.git
cd Aegis
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:4000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

VITE_API_URL=http://localhost:5000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application (Concurrent Mode)
Run both the Vite frontend development server and the Node.js backend simultaneously:
```bash
npm run dev
```
- Frontend will be live at: `http://localhost:4000`
- Backend will be live at: `http://localhost:5000`


