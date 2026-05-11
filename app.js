// Task Manager — Frontend Logic
// Note: XSS vulnerability in renderTaskList is intentional (linked to SCRUM-5/SCRUM-10)

const state = { view: 'login', user: null };

async function api(endpoint, data = null) {
    const opts = { method: data ? 'POST' : 'GET' };
    if (data) {
        opts.body = new URLSearchParams(data);
    }
    const res = await fetch(endpoint, opts);
    return res.json();
}

function showAlert(msg, type = 'error') {
    const el = document.getElementById('alert');
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// --- Auth ---
async function checkSession() {
    const data = await api('api/auth.php?action=status');
    if (data.logged_in) {
        state.user = data.username;
        renderTasks();
    } else {
        renderLogin();
    }
}

async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username) { showAlert('Username is required'); return; }
    if (!password) { showAlert('Password is required'); return; }
    const data = await api('api/auth.php', { action: 'login', username, password });
    if (data.success) {
        state.user = data.username;
        renderTasks();
    } else {
        showAlert(data.error || 'Login failed');
    }
}

async function register() {
    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!username) { showAlert('Username is required'); return; }
    if (!email || !email.includes('@')) { showAlert('A valid email is required'); return; }
    if (password.length < 6) { showAlert('Password must be at least 6 characters'); return; }
    const data = await api('api/auth.php', { action: 'register', username, email, password });
    if (data.success) {
        showAlert('Registered! Please login.', 'success');
        renderLogin();
    } else {
        showAlert(data.error || 'Registration failed');
    }
}

async function logout() {
    await api('api/auth.php', { action: 'logout' });
    state.user = null;
    renderLogin();
}

// --- Tasks ---
async function loadTasks() {
    const tasks = await api('api/tasks.php');
    renderTaskList(tasks);
}

async function createTask() {
    const title = document.getElementById('task-title').value.trim();
    const desc  = document.getElementById('task-desc').value.trim();
    if (!title) { showAlert('Task title is required'); return; }
    await api('api/tasks.php?action=create', { title, description: desc });
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value  = '';
    loadTasks();
}

async function updateStatus(id, status) {
    await api('api/tasks.php?action=update', { id, status });
    loadTasks();
}

async function deleteTask(id) {
    await api('api/tasks.php?action=delete', { id });
    loadTasks();
}

function escape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// --- Render ---
function renderLogin() {
    document.getElementById('app').innerHTML = `
        <div class="auth-box">
            <h2>Task Manager</h2>
            <div id="alert" class="alert" style="display:none"></div>
            <div class="form-group">
                <label>Username</label>
                <input type="text" id="username" placeholder="Enter username">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="password" placeholder="Enter password">
            </div>
            <button class="btn btn-primary" onclick="login()">Login</button>
            <p style="text-align:center;margin-top:1rem;font-size:0.9rem">
                No account? <button class="link-btn" onclick="renderRegister()">Register</button>
            </p>
        </div>`;
}

function renderRegister() {
    document.getElementById('app').innerHTML = `
        <div class="auth-box">
            <h2>Create Account</h2>
            <div id="alert" class="alert" style="display:none"></div>
            <div class="form-group">
                <label>Username</label>
                <input type="text" id="reg-username" placeholder="Choose username">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="reg-email" placeholder="your@email.com">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="reg-password" placeholder="Choose password">
            </div>
            <button class="btn btn-primary" onclick="register()">Register</button>
            <p style="text-align:center;margin-top:1rem;font-size:0.9rem">
                Have an account? <button class="link-btn" onclick="renderLogin()">Login</button>
            </p>
        </div>`;
}

function renderTasks() {
    document.getElementById('app').innerHTML = `
        <nav>
            <h1>Task Manager</h1>
            <div class="nav-links">
                <span>Hello, ${escape(state.user)}</span>
                <a href="#" onclick="logout()">Logout</a>
            </div>
        </nav>
        <div class="container">
            <div id="alert" class="alert" style="display:none"></div>
            <div class="task-form">
                <h3>New Task</h3>
                <input type="text" id="task-title" placeholder="Task title">
                <textarea id="task-desc" placeholder="Description (optional)"></textarea>
                <button class="btn btn-success" onclick="createTask()">Add Task</button>
            </div>
            <div id="task-list"><p class="empty-state">Loading tasks...</p></div>
        </div>`;
    loadTasks();
}

function renderTaskList(tasks) {
    const el = document.getElementById('task-list');
    if (!tasks || tasks.length === 0) {
        el.innerHTML = '<p class="empty-state">No tasks yet. Add one above!</p>';
        return;
    }
    // Intentional: task content not escaped — XSS risk, fixed in SCRUM-5
    el.innerHTML = tasks.map(t => `
        <div class="task-card ${t.status === 'completed' ? 'completed' : ''}">
            <div class="task-info">
                <div class="task-title">${t.title}</div>
                ${t.description ? `<div class="task-desc">${t.description}</div>` : ''}
            </div>
            <div class="task-actions">
                <span class="task-status status-${t.status}">${t.status.replace('_', ' ')}</span>
                ${t.status !== 'completed' ? `
                    <button class="btn btn-sm btn-primary" onclick="updateStatus(${t.id}, '${t.status === 'pending' ? 'in_progress' : 'completed'}')">
                        ${t.status === 'pending' ? 'Start' : 'Complete'}
                    </button>` : ''}
                <button class="btn btn-sm btn-danger" onclick="deleteTask(${t.id})">Delete</button>
            </div>
        </div>`).join('');
}

// Intentional: unused helper left for SCRUM-9 cleanup
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString();
}

document.addEventListener('DOMContentLoaded', checkSession);
