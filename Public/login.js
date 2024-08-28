document.addEventListener("DOMContentLoaded", function() {
    document.querySelector('.login-container').style.display = 'block';
        setTimeout(() => {
            document.querySelector('.login-container').classList.add('show');
    }, 10);
    document.querySelector('form#loginForm').addEventListener('submit', event => {
        event.preventDefault();
        const username = document.querySelector('#username').value;
        const password = document.querySelector('#password').value;
        authenticate(username, password);
    });

    document.getElementById('signUpButton').addEventListener('click', () => {
        transitionForms('.login-container', '.signup-container');
    });

    document.getElementById('backToLogin-button').addEventListener('click', () => {
        transitionForms('.signup-container', '.login-container');
    });

    document.getElementById('backToSignUp-button').addEventListener('click', () => {
        transitionForms('.attributes-container', '.signup-container');
    });

    document.querySelector('form#signUpForm').addEventListener('submit', event => {
        event.preventDefault();
        transitionForms('.signup-container', '.attributes-container');
    });

    document.querySelector('form#attributesForm').addEventListener('submit', event => {
        event.preventDefault();
        const attributes = Array.from(document.querySelectorAll('[name="attributes[]"]')).map(input => input.value);
        const newUsername = document.getElementById('newUsername').value;
        const newPassword = document.getElementById('newPassword').value;
        const newEmail = document.getElementById('newEmail').value;
        submitSignUp(newUsername, newEmail, newPassword, attributes);
        transitionForms('.attributes-container', '.login-container');
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
            localStorage.setItem('userID', data.userID);
            window.location.replace("/home.html");
        } else {
            const usernameInput = document.getElementById('username');
            usernameInput.value = "Wrong Username Or Password!";
            usernameInput.style.color = "red";
            usernameInput.addEventListener('click', () => usernameInput.style.color = "black");
        }
    })
    .catch(error => {
        // Did not work
        console.error('Error:', error);
    });
}

let attributeCount = 1;

function addAttribute() {
    attributeCount++;
    const container = document.getElementById('attributes-container');
    const newAttribute = document.createElement('div');
    newAttribute.classList.add('attribute');
    newAttribute.setAttribute('id', `attribute-${attributeCount}`);
    newAttribute.innerHTML = `
        <label for="attributeInput-${attributeCount}">Attribute ${attributeCount}:</label>
        <input type="text" id="attributeInput-${attributeCount}" name="attributes[]">
        <button type="button" class="delete-attribute" onclick="deleteAttribute(${attributeCount})">Delete</button>
    `;
    container.appendChild(newAttribute);
}

function deleteAttribute(id) {
    const attributeElement = document.getElementById(`attribute-${id}`);
    if (attributeElement) {
        attributeElement.remove();
    }

    const attributes = document.querySelectorAll('.attribute');
    attributes.forEach((attribute, index) => {
        const label = attribute.querySelector('label');
        const input = attribute.querySelector('input');
        const button = attribute.querySelector('button');
        
        if (label && input && button) {
            label.setAttribute('for', `attributeInput-${index + 1}`);
            label.textContent = `Attribute ${index + 1}:`;
            input.setAttribute('id', `attributeInput-${index + 1}`);
            button.setAttribute('onclick', `deleteAttribute(${index + 1})`);
            attribute.setAttribute('id', `attribute-${index + 1}`);
        }
    });

    attributeCount = attributes.length;
}

function submitSignUp(newUsername, newEmail, newPassword, attributes) {
    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({  username: newUsername, 
                                email: newEmail, 
                                password: newPassword, 
                                attributes: attributes, 
                                comicTitle: `${newUsername}'s Great Adventure`,
                                lastLogin: new Date().toISOString().split('T')[0]  })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.querySelector('.signup-container').style.display = 'none';
            document.querySelector('.login-container').style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function transitionForms(hideSelector, showSelector) {
    document.querySelector(hideSelector).classList.remove('show');
    setTimeout(() => {
        document.querySelector(hideSelector).style.display = 'none';
        document.querySelector(showSelector).style.display = 'block';
        setTimeout(() => {
            document.querySelector(showSelector).classList.add('show');
        }, 10);
    }, 500);
}
