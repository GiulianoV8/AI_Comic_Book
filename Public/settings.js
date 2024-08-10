document.addEventListener('DOMContentLoaded', () => {
    console.log('loaded');
    // Change title
    const preSetTitleBtn = document.getElementById('preSetTitleBtn');
    const titleInputContainer = document.getElementById('titleInputContainer');
    const titleInput = document.getElementById('titleInput');
    const submitTitleBtn = document.getElementById('submitTitleBtn');
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    // Change hero attributes
    const modal = document.getElementById('editAttributesModal');
    const editHeroBtn = document.getElementById('editAttributesBtn');
    const span = document.getElementsByClassName('close')[0];
    const attributeForm = document.getElementById('editAttributesForm');
    const attributesContainer = document.getElementById('attributesContainer');
    const addAttributeBtn = document.getElementById('addAttributeBtn');

    // Change username/password
    const changeUsernameModal = document.getElementById('changeUsernameModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const changeUsernameBtn = document.getElementById('changeUsernameBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const closeButtons = document.getElementsByClassName('close');


    let userID = localStorage.getItem('userID'); // Replace with the actual userID

    // Open Change Username Modal
    changeUsernameBtn.onclick = function() {
        changeUsernameModal.style.display = 'block';
    }

    // Open Change Password Modal
    changePasswordBtn.onclick = function() {
        changePasswordModal.style.display = 'block';
    }

    // Close modals
    Array.from(closeButtons).forEach(button => {
        button.onclick = function() {
            changeUsernameModal.style.display = 'none';
            changePasswordModal.style.display = 'none';
        }
    });

    window.onclick = function(event) {
        if (event.target == changeUsernameModal) {
            changeUsernameModal.style.display = 'none';
        }
        if (event.target == changePasswordModal) {
            changePasswordModal.style.display = 'none';
        }
    }

    // Handle Change Username Form Submission
    document.getElementById('changeUsernameForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const newUsername = document.getElementById('newUsername').value;
        try {
            const response = await fetch('/changeUsername', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userID: userID, newUsername: newUsername })
            });

            if (response.ok) {
                alert('Username updated successfully! Make sure your comic title is what you would like.');
                changeUsernameModal.style.display = 'none';
            } else {
                alert('Error updating username');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Handle Change Password Form Submission
    document.getElementById('changePasswordForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        try {
            const response = await fetch('/changePassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userID: userID, newPassword: newPassword })
            });

            if (response.ok) {
                alert('Password updated successfully!');
                changePasswordModal.style.display = 'none';
            } else {
                alert('Error updating password');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    editHeroBtn.onclick = async function() {
        modal.style.display = 'block';
        
        // Fetch user's current attributes
        try {
            const response = await fetch(`/getUserAttributes?userID=${userID}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            // Clear existing attributes
            attributesContainer.innerHTML = '';

            // Populate form with current attributes
            for (const attribute of data) {
                addAttributeInput(attribute);
            }
        } catch (error) {
            console.error('Error fetching user attributes:', error);
        }
    }

    span.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    addAttributeBtn.onclick = () => addAttributeInput('');

    attributeForm.onsubmit = async function(event) {
        event.preventDefault();

        const attributes = [];
        const inputs = attributesContainer.querySelectorAll('.attribute-input');

        inputs.forEach(input => {
            attributes.push(input.querySelector('.attribute').value)
        });

        try {
            const response = await fetch('/editAttributes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userID, attributes })
            });

            if (response.ok) {
                alert('Attributes updated successfully!');
                modal.style.display = 'none';
            } else {
                alert('Error updating attributes');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function addAttributeInput(value) {
        console.log(value);
        const div = document.createElement('div');
        div.className = 'form-group attribute-input';

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.className = 'attribute';
        valueInput.placeholder = 'Attribute';
        valueInput.value = value;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => div.remove();

        div.appendChild(valueInput);
        div.appendChild(deleteBtn);

        attributesContainer.appendChild(div);
    }

    logoutBtn.addEventListener('click', () => localStorage.clear());

    preSetTitleBtn.addEventListener('click', async () => {
        if (!titleInputContainer.classList.contains('visible')) {
            console.log(localStorage.getItem('comicTitle'));

            titleInputContainer.classList.add('visible');
            titleInputContainer.classList.remove('hidden');
            titleInput.value = localStorage.getItem('comicTitle') || 'Comic Book Title';
        } else {
            titleInputContainer.classList.remove('visible');
            titleInputContainer.classList.add('hidden');
        }
    }); 

    submitTitleBtn.addEventListener('click', async () => {
        const newTitle = titleInput.value.trim();
        if (newTitle) {
            // Update the comic title in DynamoDB
            const response = await fetch('/setComicTitle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userID: userID, comicTitle: newTitle })
            });

            if (response.ok) {
                alert('Title updated successfully');
                titleInputContainer.classList.remove('visible');
            } else {
                alert('Error updating title');
            }
        } else {
            alert('Please enter a title');
        }
    });
});
