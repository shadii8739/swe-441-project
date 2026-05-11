# SWE 441: Software Maintenance and Evolution

## Task Manager Web App

A simple task management web application used as the subject project for SWE 441 maintenance exercises.

**Stack:** HTML / CSS / JavaScript (frontend) + PHP (backend API) + MySQL (database)

---

## Setup

### Requirements
- PHP 7.4+ with `mysqli` extension
- MySQL 5.7+
- A local web server (XAMPP, WAMP, or similar)

### Steps

1. Clone the repo into your web server's document root (e.g., `htdocs/` for XAMPP)
2. Import the database schema:
   ```bash
   mysql -u root -p < db/schema.sql
   ```
3. Update database credentials in `api/db.php` if needed
4. Open `http://localhost/swe441-project/` in your browser

---

## Project Structure

```
index.html        — Single-page app entry point
style.css         — Global styles
app.js            — Frontend logic (fetch API, DOM rendering)
api/
  auth.php        — Login, register, logout, session status
  tasks.php       — Task CRUD endpoints
  db.php          — MySQL connection
db/
  schema.sql      — Database and table definitions
```

---

## Jira Project

Issues are tracked at: https://swe441-project.atlassian.net  
Project key: `SCRUM`

Commit message format: `SCRUM-N: short description`
