const state = { view: 'login', user: null, darkMode: false, csrfToken: null };

function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-mode', state.darkMode);
    const btn = document.getElementById('dark-toggle');
    if (btn) btn.textContent = state.darkMode ? '☀️ Light' : '🌙 Dark';
}

async function getCsrfToken() {
    if (!state.csrfToken) {
        const res = await fetch('api/auth.php?action=csrf_token');
        const data = await res.json();
        state.csrfToken = data.csrf_token;
    }
    return state.csrfToken;
}

async function api(endpoint, data = null) {
    const opts = { method: data ? 'POST' : 'GET' };
    if (data) {
        const token = await getCsrfToken();
        opts.body = new URLSearchParams({ ...data, csrf_token: token });
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
                <button class="link-btn nav-btn" onclick="renderTasks()">My Tasks</button>
                <button class="link-btn nav-btn" onclick="renderCategories()">Categories</button>
                <button id="dark-toggle" class="dark-toggle" onclick="toggleDarkMode()">${state.darkMode ? '☀️ Light' : '🌙 Dark'}</button>
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

function renderCategories() {
    document.getElementById('app').innerHTML = `
        <nav>
            <h1>Task Manager</h1>
            <div class="nav-links">
                <span>Hello, ${escape(state.user)}</span>
                <button class="link-btn nav-btn" onclick="renderTasks()">My Tasks</button>
                <button class="link-btn nav-btn" onclick="renderCategories()">Categories</button>
                <button id="dark-toggle" class="dark-toggle" onclick="toggleDarkMode()">${state.darkMode ? '☀️ Light' : '🌙 Dark'}</button>
                <a href="#" onclick="logout()">Logout</a>
            </div>
        </nav>
        <div class="container">
            <h2 class="section-title">Task Categories</h2>
            <div class="category-grid">
                <div class="category-card" onclick="renderTasks()">
                    <div class="category-icon">📋</div>
                    <div class="category-name">All Tasks</div>
                    <div class="category-desc">View and manage all your tasks</div>
                </div>
                <div class="category-card">
                    <div class="category-icon">⏳</div>
                    <div class="category-name">Pending</div>
                    <div class="category-desc">Tasks waiting to be started</div>
                </div>
                <div class="category-card">
                    <div class="category-icon">🔄</div>
                    <div class="category-name">In Progress</div>
                    <div class="category-desc">Tasks currently being worked on</div>
                </div>
                <div class="category-card">
                    <div class="category-icon">✅</div>
                    <div class="category-name">Completed</div>
                    <div class="category-desc">Finished tasks</div>
                </div>
            </div>
        </div>`;
}

function renderTaskList(tasks) {
    const el = document.getElementById('task-list');
    el.innerHTML = '';
    if (!tasks || tasks.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-state';
        p.textContent = 'No tasks yet. Add one above!';
        el.appendChild(p);
        return;
    }
    tasks.forEach(t => {
        const card = document.createElement('div');
        card.className = 'task-card' + (t.status === 'completed' ? ' completed' : '');

        const info = document.createElement('div');
        info.className = 'task-info';

        const titleEl = document.createElement('div');
        titleEl.className = 'task-title';
        titleEl.textContent = t.title;
        info.appendChild(titleEl);

        if (t.description) {
            const descEl = document.createElement('div');
            descEl.className = 'task-desc';
            descEl.textContent = t.description;
            info.appendChild(descEl);
        }

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const badge = document.createElement('span');
        badge.className = `task-status status-${t.status}`;
        badge.textContent = t.status.replace('_', ' ');
        actions.appendChild(badge);

        if (t.status !== 'completed') {
            const nextStatus = t.status === 'pending' ? 'in_progress' : 'completed';
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-primary';
            btn.textContent = t.status === 'pending' ? 'Start' : 'Complete';
            btn.addEventListener('click', () => updateStatus(t.id, nextStatus));
            actions.appendChild(btn);
        }

        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-danger';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => deleteTask(t.id));
        actions.appendChild(delBtn);

        card.appendChild(info);
        card.appendChild(actions);
        el.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', checkSession);
