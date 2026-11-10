


const loginForm = document.getElementById('loginForm');

// checks if the user is already logged in by checking for an access token in session storage
// if the access token exists, the user is redirected to the dashboard page
window.addEventListener('DOMContentLoaded', () => {
    if (isUserLoggedIn()) {
        window.location.href = 'dashboard.html';
    }
});


const isUserLoggedIn = () => {
    const accessToken = sessionStorage.getItem('accessToken');
    return !!accessToken; // returns true if accessToken exists, false otherwise
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('https://trace-9393.onrender.com/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            console.log('Login successful:', data);
            sessionStorage.setItem('accessToken', data.accessToken);

            if (isUserLoggedIn()) {
                window.location.href = 'dashboard.html';
            }
        } else {
            console.error('Login failed:', data.error);
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
});


const logoutButton = document.querySelector('.logout');
logoutButton.addEventListener('click', (event) => {
    event.preventDefault();
    sessionStorage.removeItem('accessToken');
    window.location.href = 'index.html';
});