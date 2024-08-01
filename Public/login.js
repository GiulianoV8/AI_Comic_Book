document.addEventListener("DOMContentLoaded", function() {
    document.querySelector('form#loginForm').addEventListener('submit', event => {
        event.preventDefault();
        const username = document.querySelector('#username').value;
        const password = document.querySelector('#password').value;
        authenticate(username, password);
    });

    document.getElementById('signUpButton').addEventListener('click', () => {
        document.querySelector('.login-container').style.display = 'none';
        document.querySelector('.signup-container').style.display = 'block';
    });

    document.getElementById('backToLogin-button').addEventListener('click', () => {
        document.querySelector('.login-container').style.display = 'block';
        document.querySelector('.signup-container').style.display = 'none';
    });
    document.querySelector('form#signUpForm').addEventListener('submit', event => {
        event.preventDefault();
        const newUsername = document.querySelector('#newUsername').value;
        const newEmail = document.querySelector('#newEmail').value;
        const newPassword = document.querySelector('#newPassword').value;
        signUp(newUsername, newEmail, newPassword);
    });
});

function authenticate(username, password) {
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.replace("/home.html");
        } else {
            alert('Invalid username or password.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function signUp(newUsername, newEmail, newPassword) {
    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: newUsername, email: newEmail, password: newPassword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('User created successfully!');
            document.querySelector('.signup-container').style.display = 'none';
            document.querySelector('.login-container').style.display = 'block';
        } else {
            alert('Error creating user.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
