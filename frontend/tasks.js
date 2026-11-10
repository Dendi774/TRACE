const API_URL = 'https://trace-backend.onrender.com/api';

// CHANGE THIS if your activities model names its primary key differently
const TASK_ID_FIELD = 'activity_ID';

// Subject colors are picked by subject_ID (keep this list identical to subjects.js)
const SUBJECT_COLORS = ['#8B4F36', '#6A1FB0', '#1F4FAE', '#2E7D4F', '#C2410C', '#0E7490', '#9D174D', '#4D7C0F'];
const getSubjectColor = (id) =>
    Number.isInteger(id) ? SUBJECT_COLORS[(id - 1) % SUBJECT_COLORS.length] : '#176187';

const modal = document.getElementById('task-modal');
const addBtn = document.getElementById('add-task-btn');
const deleteBtn = document.getElementById('delete-task-btn');
const deleteHint = document.getElementById('delete-hint');
const closeBtn = document.getElementById('close-modal-btn');
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const tasksTable = document.querySelector('.tasks-table');
const formError = document.getElementById('form-error');
const submitBtn = document.getElementById('task-submit-btn');
const logoutBtn = document.querySelector('.logout');

let tasks = []; // array to hold tasks

/* ---------- Login / logout ---------- */

const logout = () => {
    sessionStorage.removeItem('accessToken');
    window.location.href = 'index.html';
};

if (!sessionStorage.getItem('accessToken')) {
    window.location.href = 'index.html';
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

// fetch wrapper: adds the base URL and token header, logs out on 401
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'accessToken': sessionStorage.getItem('accessToken'),
            ...(options.headers || {})
        }
    });

    if (res.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
    }
    return res;
}

/* ---------- Rendering ---------- */

function createCell(text) {
    const td = document.createElement('td');
    td.textContent = text; // textContent, so names can't inject HTML
    return td;
}

// the last row stretches the column dividers to the bottom of the panel
function createFillerRow() {
    const tr = document.createElement('tr');
    tr.className = 'filler-row';
    tr.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) tr.appendChild(document.createElement('td'));
    return tr;
}

function showMessage(text, isError = false) {
    taskList.innerHTML = '';

    const tr = document.createElement('tr');
    tr.className = 'message-row' + (isError ? ' message-row-error' : '');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = text;
    tr.appendChild(td);

    taskList.appendChild(tr);
    taskList.appendChild(createFillerRow());
}

// The database only stores Pending or Completed.
// Overdue / Due Soon / Upcoming are worked out here from the deadline.
function getStatus(task) {
    if (task.status === 'Completed') return 'Completed';

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
    const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
    const deadline = String(task.deadline).slice(0, 10);

    if (deadline < today) return 'Overdue';
    if (deadline <= inAWeek) return 'Due Soon';
    return 'Upcoming';
}

function createTaskRow(task) {
    const tr = document.createElement('tr');
    tr.dataset.id = task[TASK_ID_FIELD];
    tr.dataset.name = task.task_Name;

    const status = getStatus(task);
    const isCompleted = status === 'Completed';
    if (isCompleted) tr.classList.add('task-done');

    // name cell: checkbox (mark as completed) + task name
    const nameTd = document.createElement('td');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'task-check';
    check.checked = isCompleted;
    check.setAttribute('aria-label', `Mark "${task.task_Name}" as completed`);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'task-name';
    nameSpan.textContent = task.task_Name;

    nameTd.append(check, nameSpan);
    tr.appendChild(nameTd);

    // subject cell: colored chip
    const subjectTd = document.createElement('td');
    const chip = document.createElement('span');
    chip.className = 'subject-chip';
    const subjectId = task.subject_ID ?? (task.Subject && task.Subject.subject_ID);
    chip.style.setProperty('--chip-color', getSubjectColor(subjectId));
    chip.textContent = task.Subject ? task.Subject.subject_Name : '';
    subjectTd.appendChild(chip);
    tr.appendChild(subjectTd);

    tr.appendChild(createCell(formatDate(task.deadline)));

    // status cell: "Due Soon" -> class "status-due-soon"
    const statusTd = createCell(status);
    statusTd.className = 'status status-' + status.toLowerCase().replace(/\s+/g, '-');
    tr.appendChild(statusTd);

    return tr;
}

function displayTasks() {
    if (tasks.length === 0) {
        showMessage('No tasks yet. Click the + button to add one.');
        return;
    }

    // unfinished tasks first (earliest deadline on top), completed ones at the bottom
    const sorted = [...tasks].sort((a, b) =>
        (a.status === 'Completed') - (b.status === 'Completed') ||
        new Date(a.deadline) - new Date(b.deadline)
    );

    taskList.innerHTML = '';
    sorted.forEach((task) => taskList.appendChild(createTaskRow(task)));
    taskList.appendChild(createFillerRow());
}

function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    });
}

/* ---------- API calls ---------- */

// load subjects into the subject dropdown
async function loadSubjects() {
    const subjectSelect = document.getElementById('task-subject');
    subjectSelect.innerHTML = '';

    try {
        const res = await apiFetch('/subjects');
        const subjects = await res.json();
        if (!res.ok || !Array.isArray(subjects)) throw new Error(subjects.error || 'Could not load subjects.');

        const placeholder = new Option(
            subjects.length ? 'Select a subject' : 'Add a subject first',
            '', true, true
        );
        placeholder.disabled = true;
        subjectSelect.appendChild(placeholder);

        subjects.forEach((subject) => {
            subjectSelect.appendChild(new Option(subject.subject_Name, subject.subject_ID));
        });
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// load tasks for the logged-in user
async function loadTasks() {
    try {
        const res = await apiFetch('/activities');
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) throw new Error(data.error || 'Could not load tasks.');

        tasks = data;
        displayTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showMessage(error.message, true);
    }
}

async function deleteTask(id, name) {
    const ok = confirm(`Delete "${name}"?`);
    if (!ok) return;

    try {
        const res = await apiFetch(`/activities/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not delete task.');
        await loadTasks();
    } catch (error) {
        alert(error.message);
    }
}

// tick = completed, untick = back to pending
async function setCompleted(id, completed) {
    try {
        const res = await apiFetch(`/activities/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ completed })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not update task.');
    } catch (error) {
        alert(error.message);
    }

    // reload either way so the table always matches the database
    await loadTasks();
}

/* ---------- Completed checkbox ---------- */

// one listener on the table body handles every checkbox
taskList.addEventListener('change', (event) => {
    const check = event.target.closest('.task-check');
    if (!check) return;

    const row = check.closest('tr[data-id]');
    setCompleted(row.dataset.id, check.checked);
});

// delete mode
deleteBtn.addEventListener('click', () => {
    const active = tasksTable.classList.toggle('delete-mode');
    deleteBtn.classList.toggle('active', active);
    deleteBtn.setAttribute('aria-pressed', active);
    deleteHint.style.opacity = active ? 1 : 0;
});

// one listener on the table body handles clicks on every task row
taskList.addEventListener('click', (event) => {
    if (!tasksTable.classList.contains('delete-mode')) return;

    const row = event.target.closest('tr[data-id]'); // ignores the filler and message rows
    if (!row) return;

    deleteTask(row.dataset.id, row.dataset.name);
});

// task modal for adding new tasks
const openModal = () => {
    formError.textContent = '';
    modal.classList.add('open');
    document.getElementById('task-name').focus();
};

const closeModal = () => {
    modal.classList.remove('open');
    taskForm.reset();
    formError.textContent = '';
};

addBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);

// clicking outside the modal window closes it
modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
});

// Esc key closes it
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

taskForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.textContent = '';
    submitBtn.disabled = true; // prevents double submits

    const newTask = {
        task_Name: document.getElementById('task-name').value.trim(),
        subject_ID: Number(document.getElementById('task-subject').value),
        deadline: document.getElementById('task-deadline').value // YYYY-MM-DD
    };

    try {
        const res = await apiFetch('/activities', {
            method: 'POST',
            body: JSON.stringify(newTask)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not add task.');

        closeModal();
        await loadTasks();
    } catch (error) {
        formError.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadSubjects();
    loadTasks();
});