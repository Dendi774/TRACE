const API_URL = 'http://localhost:5000/api';

// Subject colors are picked by subject_ID
const SUBJECT_COLORS = ['#8B4F36', '#6A1FB0', '#1F4FAE', '#2E7D4F', '#C2410C', '#0E7490', '#9D174D', '#4D7C0F'];
const getSubjectColor = (id) =>
    Number.isInteger(id) ? SUBJECT_COLORS[(id - 1) % SUBJECT_COLORS.length] : '#176187';

const subjectList = document.getElementById('subject-list');
const subjectsTable = document.querySelector('.subjects-table');
const addBtn = document.getElementById('add-subject-btn');
const deleteBtn = document.getElementById('delete-subject-btn');
const deleteHint = document.getElementById('delete-hint');
const modal = document.getElementById('subject-modal');
const closeBtn = document.getElementById('close-modal-btn');
const subjectForm = document.getElementById('subject-form');
const nameInput = document.getElementById('subject-name');
const formError = document.getElementById('form-error');
const submitBtn = document.getElementById('subject-submit-btn');
const logoutBtn = document.querySelector('.logout');


// login and logout
const logout = () => {
    sessionStorage.removeItem('accessToken');
    window.location.href = 'index.html';
};

if (!sessionStorage.getItem('accessToken')) {
    window.location.href = 'index.html';
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

// fetch wrapper to be reuse when fetching the api
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


// gets the status of each task
function getStatus(task) {
    if (task.status === 'Completed') return 'Completed';

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
    const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
    const deadline = String(task.deadline).slice(0, 10);

    if (deadline < today) return 'Overdue';
    if (deadline <= inAWeek) return 'Due Soon';
    return 'Upcoming';
}

// adds pending / completed / overdue counts to every subject
function addCounts(subjects, tasks) {
    return subjects.map((subject) => {
        const counts = { pending: 0, completed: 0, overdue: 0 };

        // only this subject's tasks
        const subjectTasks = tasks.filter((task) =>
            Number(task.subject_ID ?? task.Subject?.subject_ID) === Number(subject.subject_ID)
        );

        subjectTasks.forEach((task) => {
            const status = getStatus(task);
            if (status === 'Completed') counts.completed++;
            else if (status === 'Overdue') counts.overdue++;
            else counts.pending++; // Due Soon and Upcoming both count as pending
        });

        return { ...subject, ...counts };
    });
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
    subjectList.innerHTML = '';

    const tr = document.createElement('tr');
    tr.className = 'message-row' + (isError ? ' message-row-error' : '');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = text;
    tr.appendChild(td);

    subjectList.appendChild(tr);
    subjectList.appendChild(createFillerRow());
}

function createSubjectRow(subject) {
    const tr = document.createElement('tr');
    // delete mode reads these when the row is clicked
    tr.dataset.id = subject.subject_ID;
    tr.dataset.name = subject.subject_Name;

    const nameCell = document.createElement('td');
    const chip = document.createElement('span');
    chip.className = 'subject-chip';
    chip.style.setProperty('--chip-color', getSubjectColor(subject.subject_ID));
    chip.textContent = subject.subject_Name;
    nameCell.appendChild(chip);
    tr.appendChild(nameCell);

    [subject.pending, subject.completed, subject.overdue].forEach((count) => {
        const td = document.createElement('td');
        td.textContent = count;
        tr.appendChild(td);
    });

    return tr;
}

function renderSubjects(subjects) {
    if (subjects.length === 0) {
        showMessage('No subjects yet. Click the + button to add one.');
        return;
    }

    subjectList.innerHTML = '';
    subjects.forEach((subject) => subjectList.appendChild(createSubjectRow(subject)));
    subjectList.appendChild(createFillerRow());
}

// API CALLS
// loads subjects and tasks together, then counts each subject's tasks
async function loadSubjects() {
    try {
        const [subjectsRes, tasksRes] = await Promise.all([
            apiFetch('/subjects'),
            apiFetch('/activities')
        ]);
        const subjects = await subjectsRes.json();
        const tasks = await tasksRes.json();

        if (!subjectsRes.ok || !Array.isArray(subjects)) throw new Error(subjects.error || 'Could not load subjects.');
        if (!tasksRes.ok || !Array.isArray(tasks)) throw new Error(tasks.error || 'Could not load tasks.');

        renderSubjects(addCounts(subjects, tasks));
    } catch (error) {
        showMessage(error.message, true);
    }
}

async function deleteSubject(id, name) {
    const ok = confirm(`Delete "${name}"? All of its tasks will be deleted too.`);
    if (!ok) return;

    try {
        const res = await apiFetch(`/subjects/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not delete subject.');
        await loadSubjects();
    } catch (error) {
        alert(error.message);
    }
}

// delete mode
deleteBtn.addEventListener('click', () => {
    const active = subjectsTable.classList.toggle('delete-mode');
    deleteBtn.classList.toggle('active', active);
    deleteBtn.setAttribute('aria-pressed', active);
    deleteHint.style.opacity = active ? 1 : 0;
});

// one listener on the table body handles clicks on every subject row
subjectList.addEventListener('click', (event) => {
    if (!subjectsTable.classList.contains('delete-mode')) return;

    const row = event.target.closest('tr[data-id]'); // ignores the filler and message rows
    if (!row) return;

    deleteSubject(row.dataset.id, row.dataset.name);
});


// subject modal for adding subjects
const openModal = () => {
    formError.textContent = '';
    modal.classList.add('open');
    nameInput.focus();
};

const closeModal = () => {
    modal.classList.remove('open');
    subjectForm.reset();
    formError.textContent = '';
};

addBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal(); // click on the dark backdrop
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

subjectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.textContent = '';
    submitBtn.disabled = true; // prevents double submits

    try {
        const res = await apiFetch('/subjects', {
            method: 'POST',
            body: JSON.stringify({ subjectName: nameInput.value.trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not add subject.');

        closeModal();
        await loadSubjects();
    } catch (error) {
        formError.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
    }
});

loadSubjects();