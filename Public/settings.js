document.addEventListener('DOMContentLoaded', () => {
    console.log('loaded');
    
    // Cache DOM elements
    const editTitleBtn = document.getElementById('editTitleBtn');
    const titleInputContainer = document.getElementById('titleInputContainer');
    const titleInput = document.getElementById('titleInput');
    const submitTitleBtn = document.getElementById('submitTitleBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const modal = document.getElementById('editAttributesModal');
    const editHeroBtn = document.getElementById('editAttributesBtn');
    const attributeForm = document.getElementById('editAttributesForm');
    const attributesContainer = document.getElementById('attributesContainer');
    const addAttributeBtn = document.getElementById('addAttributeBtn');
    const changeUsernameModal = document.getElementById('changeUsernameModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const changeUsernameBtn = document.getElementById('changeUsernameBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const closeButtons = document.getElementsByClassName('close');

    let userID = localStorage.getItem('userID'); // Replace with the actual userID

    // Utility function to close all modals
    function closeModals() {
        [changeUsernameModal, changePasswordModal, modal, document.getElementById("titleModal")].forEach(modal => modal.classList.add('hidden'));
    }

    // Open Change Username Modal
    changeUsernameBtn.onclick = () => changeUsernameModal.classList.remove('hidden');

    // Open Change Password Modal
    changePasswordBtn.onclick = () => changePasswordModal.classList.remove('hidden');

    // Close modals
    Array.from(closeButtons).forEach(button => button.onclick = closeModals);

    window.onclick = event => {
        if ([changeUsernameModal, changePasswordModal, modal, document.getElementById("titleModal")].includes(event.target)) {
            closeModals();
        }
    };

    // Handle Change Username Form Submission
    document.getElementById('changeUsernameForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const newUsername = document.getElementById('newUsername').value;
        try {
            const response = await fetch('/changeUsername', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID, newUsername })
            });
            if (response.ok) {
                alert('Username updated successfully! Make sure your comic title is what you would like.');
                closeModals();
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID, newPassword })
            });
            if (response.ok) {
                alert('Password updated successfully!');
                closeModals();
            } else {
                alert('Error updating password');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Open Edit Attributes Modal and fetch user attributes
    editHeroBtn.onclick = async function() {
        modal.classList.remove('hidden');
        let attributes = JSON.parse(localStorage.getItem('attributes')) || [];
        if (attributes.length === 0) {
            try {
                const response = await fetch(`/getUserAttributes?userID=${userID}`);
                if (!response.ok) throw new Error('Network response was not ok');
                attributes = await response.json();
            } catch (error) {
                console.error('Error fetching user attributes:', error);
            }
            localStorage.setItem('attributes', JSON.stringify(attributes));
        }
        attributesContainer.innerHTML = '';
        attributes.forEach(attribute => addAttributeInput(attribute));
    }

    addAttributeBtn.onclick = () => addAttributeInput('');

    attributeForm.onsubmit = async function(event) {
        event.preventDefault();
        const attributes = Array.from(attributesContainer.querySelectorAll('.attribute-input .attribute')).map(input => input.value);
        localStorage.setItem('attributes', JSON.stringify(attributes));
        try {
            const response = await fetch('/editAttributes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID, attributes })
            });
            if (response.ok) {
                alert('Attributes updated successfully!');
                closeModals();
            } else {
                alert('Error updating attributes');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function addAttributeInput(value) {
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

    editTitleBtn.onclick = function() {
        document.getElementById("titleModal").classList.remove('hidden');
        titleInput.value = localStorage.getItem("comicTitle") || '';
    }

    document.getElementById("closeTitleModal").onclick = () => document.getElementById("titleModal").classList.add('hidden');
    
    document.getElementById("cancelTitleBtn").onclick = () => document.getElementById("titleModal").classList.add('hidden');

    submitTitleBtn.addEventListener('click', async () => {
        const newTitle = titleInput.value.trim();
        if (newTitle) {
            try {
                const response = await fetch('/setComicTitle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userID, comicTitle: newTitle })
                });
                if (response.ok) {
                    alert('Title updated successfully');
                    titleInputContainer.classList.remove('visible');
                } else {
                    alert('Error updating title');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        } else {
            alert('Please enter a title');
        }
    });
});
