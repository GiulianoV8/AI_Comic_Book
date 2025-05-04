document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const editTitleBtn = document.getElementById('editTitleBtn');
    const titleInputContainer = document.getElementById('titleInputContainer');
    const titleInput = document.getElementById('titleInput');
    const submitTitleBtn = document.getElementById('submitTitleBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const attributesModal = document.getElementById('editAttributesModal');
    const editHeroBtn = document.getElementById('editAttributesBtn');
    const attributeForm = document.getElementById('editAttributesForm');
    const changeUsernameModal = document.getElementById('changeUsernameModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const changeUsernameBtn = document.getElementById('changeUsernameBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const closeButtons = document.getElementsByClassName('close');

    let userID = localStorage.getItem('userID'); // Replace with the actual userID

    // Utility function to close all modals
    function closeModals() {
        [changeUsernameModal, changePasswordModal, attributesModal, document.getElementById("titleModal")].forEach(modal => modal.classList.add('hidden'));
    }

    // Open Change Username Modal
    changeUsernameBtn.onclick = () => changeUsernameModal.classList.remove('hidden');

    // Open Change Password Modal
    changePasswordBtn.onclick = () => changePasswordModal.classList.remove('hidden');

    // Close modals
    Array.from(closeButtons).forEach(button => button.onclick = closeModals);

    window.onclick = event => {
        if ([changeUsernameModal, changePasswordModal, attributesModal, document.getElementById("titleModal")].includes(event.target)) {
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
                closeModals();
            } else {
                newUsername.value = 'Error updating username';
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
                closeModals();
            } else {
                newPassword.value = 'Error updating password';
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Open Edit Attributes Modal and fetch user attributes
    editHeroBtn.onclick = async function() {
        console.log('Open Edit Attributes Modal');
        attributesModal.classList.remove('hidden');
        let attributes = JSON.parse(localStorage.getItem('attributes')) || {};
        if (Object.keys(attributes).length === 0 && attributes.constructor === Object) {
            try {
                const response = await fetch(`/getUserAttributes?userID=${userID}`);
                if (!response.ok) throw new Error('Network response was not ok');
                attributes = await response.json();
            } catch (error) {
                console.error('Error fetching user attributes:', error);
            }
            localStorage.setItem('attributes', JSON.stringify(attributes));
        }

        // Get avatar url from s3 to display on #avatar-image
        try {
            const response = await fetch(`/getAvatarURL?username=${localStorage.getItem('username')}`);
            console.log(response);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            document.getElementById('avatar-image').src = data.url;
            document.getElementById('avatar-image').style.display = 'block';
        } catch (error) {
            console.error('Error fetching avatar url:', error);
        }

    }
    
    const captureBtn = document.getElementById('capture-btn');
    const generateContainer = document.getElementById('generate-container');
    const confirmAvatarBtn = document.getElementById('confirm-avatar-btn');
    const generateAvatarBtn = document.getElementById('generate-avatar-btn');
    const avatarContainer = document.getElementById('avatar-container');
    const cameraContainer = document.getElementById('camera-container');
    const arrow = document.getElementById('down-arrow');
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('output-canvas');
    const avatarImage = document.getElementById('avatar-display-image');
    const takePicBtn = document.getElementById('take-picture-btn');
   
    attributeForm.onsubmit = async function(event) {
        event.preventDefault();

        let gender = document.getElementById('gender').value;
        if(gender == "Non-binary"){
            gender = "";
        }
        
        const attributes = {
            gender: gender,
			age: document.getElementById("age").value < 21 ? "young" : document.getElementById("age").value,
        };
        
        localStorage.setItem('attributes', JSON.stringify(attributes));

        const blobresponse = await fetch(avatarImage.src);
        const blob = await blobresponse.blob();
    
        let data = await uploadUserPhoto(blob, username);
        
        if (data.success) {
            console.log('Avatar uploaded successfully:', data.url);
        } else {
            console.error('Upload failed:', data.message);
        }

        try {
            const response = await fetch('/editAttributes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID, attributes })
            });
            if (response.ok) {
                closeModals();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Start webcam and continuously detect face
    async function startWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
        } catch (error) {
            console.error('Error accessing webcam:', error);
        }
    }

    // Capture or Retake Photo
    captureBtn.addEventListener("click", () => {
        if (captureBtn.innerHTML === "Capture Photo") {
            // Capture photo
            const ctx = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Hide video and show canvas
            video.style.display = "none";
            canvas.style.display = "block";

            // Change button text to "Retake"
            captureBtn.innerHTML = "Retake";

            // Show the generate avatar section
            generateContainer.style.display = "block";
            generateAvatarBtn.innerHTML === "Generate Superhero Avatar"

        } else {
            // Retake photo
            video.style.display = "block";
            canvas.style.display = "none";
            captureBtn.innerHTML = "Capture Photo";

            // Hide the generate avatar section
            generateContainer.style.display = "none";
            avatarContainer.style.display = "none";
        }
    });

    async function init() {
        await startWebcam();
    }

    takePicBtn.addEventListener('click', () => {
        if(takePicBtn.innerHTML == "Change Avatar?"){
            document.getElementById('avatar-image').style.display = "none";
            cameraContainer.style.display = "block";
            init()
            takePicBtn.innerHTML = "Cancel";
        }else{
            generateContainer.style.display = "none";
            avatarContainer.style.display = "none";
            cameraContainer.style.display = "none";
            takePicBtn.innerHTML = "Change Avatar?";
            document.getElementById('avatar-image').style.display = "block";
        }
    });
   
    // Generate or Regenerate Avatar
    generateAvatarBtn.addEventListener("click", async () => {
        if (generateAvatarBtn.innerHTML === "Generate Superhero Avatar") {
            generateAvatarBtn.innerHTML = "Regenerate Avatar";
        }

        generateAvatarBtn.disabled = true;
        const username = document.getElementById('newUsername').value.trim();
        // const imageBlob = await generateSuperheroAvatar(username);
        const imageBlob = true;
        if(imageBlob) {
            // Display avatar preview
            const avatarURL = './imgs/DailyHeroics.png'; //URL.createObjectURL(imageBlob);
            avatarImage.src = avatarURL;
            avatarImage.style.display = 'block';
    
            // Show avatar image and container
            avatarContainer.style.display = 'block';
    
            // Hide generate section
            arrow.style.display = 'none';
        }
        generateAvatarBtn.disabled = false;
    });

    // Upload image to backend
    async function uploadUserPhoto(imageFile, username) {  
        console.log("Uploading file:", imageFile);
        console.log("Username:", username);
        
        const formData = new FormData();
        formData.append('username', username);
        formData.append('image', imageFile);
    
        try {
            const response = await fetch('/uploadAvatar', {
                method: 'POST',
                body: formData
            });
    
            return await response.json();
        } catch (error) {
            console.error('Error uploading avatar:', error);
        }
    }
    
    // Generate superhero avatar using Stability AI API
    async function generateSuperheroAvatar(username) {
        console.log("Generating superhero avatar...");
    
        const response = await fetch('/generateSuperheroAvatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
    
        if (!response.ok) {
            console.error("Failed to generate avatar");
            return null;
        }
    
        return await response.blob();
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
        if (newTitle.length > 0) {
            try {
                const response = await fetch('/setComicTitle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userID, comicTitle: newTitle })
                });
                if (response.ok) {
                    closeModals();
                    localStorage.setItem("comicTitle", newTitle);
                } else {
                    newTitle.value = 'Error updating title';
                }
            } catch (error) {
                console.error('Error:', error);
            }
        } else {
            newTitle.value = 'Please enter a title';
        }
    });
});
