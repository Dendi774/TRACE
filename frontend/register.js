const API_URL = 'https://trace-9393.onrender.com/api';

const registerForm = document.getElementById('registerForm');
const formMessage = document.getElementById('formMessage');
const registerBtn = document.getElementById('registerBtn');

// someone who is already logged in doesn't need this page
if (sessionStorage.getItem('accessToken')) {
    window.location.href = 'dashboard.html';
}

// shows red text, or green text when isSuccess is true
function showMessage(text, isSuccess = false) {
    formMessage.textContent = text;
    formMessage.classList.toggle('success', isSuccess);
}

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // quick checks in the browser before bothering the server
    if (username.length < 3) return showMessage('Username must be at least 3 characters.');
    if (password.length < 6) return showMessage('Password must be at least 6 characters.');
    if (password !== confirmPassword) return showMessage('Passwords do not match.');

    registerBtn.disabled = true; // prevents double submits

    try {
        const res = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed.');

        showMessage('Account created! Taking you to the login page...', true);
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    } catch (error) {
        // a TypeError here means the request never reached the server
        showMessage(error instanceof TypeError
            ? 'Cannot reach the server. Is the back-end running?'
            : error.message);
        registerBtn.disabled = false;
    }
});