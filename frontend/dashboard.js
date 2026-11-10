const API_URL = 'https://trace-backend.onrender.com/api';
const MAX_DEADLINES = 10; // how many rows to show in "Upcoming Deadlines"

// Subject colors are picked by subject_ID
const SUBJECT_COLORS = ['#8B4F36', '#6A1FB0', '#1F4FAE', '#2E7D4F', '#C2410C', '#0E7490', '#9D174D', '#4D7C0F'];
const getSubjectColor = (id) =>
    Number.isInteger(id) ? SUBJECT_COLORS[(id - 1) % SUBJECT_COLORS.length] : '#176187';

const logoutButton = document.querySelector('.logout');
const statPending = document.getElementById('stat-pending');
const statOverdue = document.getElementById('stat-overdue');
const statCompleted = document.getElementById('stat-completed');
const statTotal = document.getElementById('stat-total');
const deadlineList = document.getElementById('deadline-list');
const username = document.getElementById('username');

let tasks = [];

// login and logout
const isUserLoggedIn = () => !!sessionStorage.getItem('accessToken');

const logout = () => {
    sessionStorage.removeItem('accessToken');
    window.location.href = 'index.html';
};

logoutButton.addEventListener('click', logout);

// fetch wrapper to be reuse
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

window.addEventListener('DOMContentLoaded', () => {
    if (!isUserLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    updateName();
    getAllActivities();
});


// gets the status of each tasks
function getStatus(task) {
    if (task.status === 'Completed') return 'Completed';

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
    const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
    const deadline = String(task.deadline).slice(0, 10);

    if (deadline < today) return 'Overdue';
    if (deadline <= inAWeek) return 'Due Soon';
    return 'Upcoming';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    });
}


// get all the activities of the logged-in user
const getAllActivities = async () => {
    try {
        const res = await apiFetch('/activities');
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) throw new Error(data.error || 'Could not load tasks.');

        tasks = data;
        updateTaskStats();
        updateUpcomingDeadlines();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNoDeadlines(error.message);
    }
};

// update the stat cards
const updateTaskStats = () => {
    const statuses = tasks.map(getStatus);

    // pending = not completed and not overdue yet
    statPending.textContent = statuses.filter((s) => s === 'Due Soon' || s === 'Upcoming').length;
    statOverdue.textContent = statuses.filter((s) => s === 'Overdue').length;
    statCompleted.textContent = statuses.filter((s) => s === 'Completed').length;
    statTotal.textContent = tasks.length;
};

// upcoming deadlines
function showNoDeadlines(text) {
    deadlineList.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'no-deadlines';
    p.textContent = text;
    deadlineList.appendChild(p);
}


function createDeadlineRow(task) {
    const row = document.createElement('div');
    row.className = 'deadline-row';

    const subjectId = task.subject_ID ?? task.Subject?.subject_ID;
    row.style.setProperty('--row-color', getSubjectColor(subjectId));

    const name = document.createElement('span');
    name.className = 'deadline-name';
    const subjectName = task.Subject ? task.Subject.subject_Name : '';
    name.textContent = `${subjectName} ${task.task_Name}`.trim();

    const date = document.createElement('span');
    date.className = 'deadline-date';
    date.textContent = formatDate(task.deadline);

    const status = document.createElement('span');
    status.className = 'deadline-status';
    status.textContent = getStatus(task);

    row.append(name, date, status);
    return row;
}

const updateUpcomingDeadlines = () => {
    // unfinished tasks only
    const upcoming = tasks
        .filter((task) => task.status !== 'Completed' && task.deadline)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, MAX_DEADLINES);

    if (upcoming.length === 0) {
        showNoDeadlines('No upcoming deadlines!');
        return;
    }

    deadlineList.innerHTML = '';
    upcoming.forEach((task) => deadlineList.appendChild(createDeadlineRow(task)));
};


const updateName = async () => {
    try {
        const res = await apiFetch('/users/getMe');
        if (!res.ok) throw new Error('Could not fetch your username.');
        const data = await res.json();
        username.textContent = data.username;
    } catch (error) {
        console.error(error);
        username.textContent = 'Student'; // fallback when the getMe returns nothing or returns an error
    }
};