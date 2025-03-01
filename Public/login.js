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

    document.querySelector('.forgot-password-link').addEventListener('click', function() {
        transitionForms('.login-container', '.recover-password-container');
    });
    
    document.getElementById('backToLoginFromRecover').addEventListener('click', function() {
        transitionForms('.recover-password-container', '.login-container');
    });
    

    const captureBtn = document.getElementById('capture-btn');
    const generateContainer = document.getElementById('generate-container');
    const confirmAvatarBtn = document.getElementById('confirm-avatar-btn');
    const generateAvatarBtn = document.getElementById('generate-avatar-btn');
    const avatarContainer = document.getElementById('avatar-container');
    const arrow = document.getElementById('down-arrow');
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('output-canvas');
    const avatarImage = document.getElementById('avatar-image');
    
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

    // Generate or Regenerate Avatar
    generateAvatarBtn.addEventListener("click", async () => {
        if (generateAvatarBtn.innerHTML === "Generate Superhero Avatar") {
            generateAvatarBtn.innerHTML = "Regenerate Avatar";
        }
        const username = document.getElementById('newUsername').value.trim();
        // const imageBlob = await generateSuperheroAvatar(username);
        const imageBlob = true;
        if(imageBlob) {
            // Display avatar preview
            const avatarURL = 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRpxkR9ItvFiXpBPl6tulrDMLkQqnQpDqK-EwgfpYllakqPagl6bNSb27Df2spuWUHaSBwSYVypvr9Ye_pgLfIhOA'; //URL.createObjectURL(imageBlob);
            avatarImage.src = avatarURL;
            avatarImage.style.display = 'block';
    
            // Show avatar image and container
            avatarContainer.style.display = 'block';
    
            // Hide generate section
            arrow.style.display = 'none';
        }
    });

    // Confirm button saves avatar
    confirmAvatarBtn.addEventListener('click', async () => {
        const username = document.getElementById('newUsername').value.trim();
        
        // Convert displayed avatar to Blob
        const response = await fetch(avatarImage.src);
        const blob = await response.blob();
    
        await uploadUserPhoto(username, blob); // Overwrite original image
    
        alert("Avatar saved successfully!");
    
        // Hide confirm button
        confirmAvatarBtn.style.display = 'none';
    });
    
    // Fetch avatar image URL
    async function fetchAvatarURL(username) {
        const response = await fetch(`/getAvatarUrl?username=${username}`);
        const data = await response.json();
        if (data.success) {
            document.getElementById("avatarImage").src = data.url;
        } else {
            console.error("Failed to load avatar");
        }
    }

    // Upload image to backend
    async function uploadUserPhoto(imageFile, username) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('username', username);
    
        try {
            const response = await fetch('/uploadAvatar', {
                method: 'POST',
                body: formData
            });
    
            const data = await response.json();
            if (data.success) {
                console.log('Avatar uploaded successfully:', data.url);
                document.getElementById('userAvatar').src = data.url; // Set avatar image
            } else {
                console.error('Upload failed:', data.message);
            }
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

    // Initialize the application
    async function init() {
        await startWebcam();
    }
    document.getElementById('take-picture-btn').addEventListener('click', init);
    
    document.getElementById('recoverPasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const recoveryEmail = document.getElementById('recoveryEmail').value;
    
        // Simulate showing the success message
        const recoveryMessage = document.getElementById('recoveryMessage');
        recoveryMessage.textContent = `Password will be sent to ${recoveryEmail}`;
        recoveryMessage.style.color = 'green';
        recoveryMessage.style.display = 'block';

        try {
            const response = await fetch('/recover-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: recoveryEmail }),
            });

            const recoveryMessage = document.getElementById('recoveryMessage');
    
            const result = await response.json();
            if (response.ok) {
                // Show success message
                recoveryMessage.style.color = 'green';
                recoveryMessage.textContent = result.message;
                
            } else {
                // Show error message
                recoveryMessage.style.color = 'red';
                recoveryMessage.textContent = `Error sending recovery email to ${recoveryEmail}.`;
            }
            recoveryMessage.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
        }

    });
    

    document.querySelector('form#signUpForm').addEventListener('submit', event => {
        event.preventDefault();
        fetch('/check-username', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: document.getElementById('newUsername').value,
                newEmail: document.getElementById('newEmail').value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.emailExists) {
                const emailField = document.getElementById('newEmail');
                emailField.style.color = 'red';
                emailField.value = 'Email Already In Use!';
                emailField.onclick = () => {
                    emailField.style.color = 'black';
                    emailField.value = '';
                }
            }
            if (data.usernameExists) {
                const usernameField = document.getElementById('newUsername');
                usernameField.style.color = 'red';
                usernameField.value = 'Username Already In Use!';
                usernameField.onclick = () => {
                    usernameField.style.color = 'black';
                    usernameField.value = '';
                }
            }
            if (!data.usernameExists && !data.emailExists) {
                transitionForms('.signup-container', '.attributes-container');
            }
        });
        
    });

    document.querySelector('form#attributesForm').addEventListener('submit', event => {
        event.preventDefault();
        let gender = "";
        let genderField = document.getElementById('gender').value;
        if(genderField == "Non-binary"){
            gender = "";
        }
        
        const attributes = {
            gender: gender,
            age: document.getElementById('age').value,
            height: document.getElementById('height').value,
            skinColor: document.getElementById('skinColor').value,
            hair: document.getElementById('hair').value,
            otherFeatures: document.getElementById('otherFeatures').value
        };
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
            usernameInput.addEventListener('click', () => {
                usernameInput.style.color = "black"
                usernameInput.value = '';
            });
        }
    })
    .catch(error => {
        // Did not work
        console.error('Error:', error);
    });
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
                                lastLogin: parseInt(new Date().toLocaleDateString('en-CA').replace(/-/g, ''))  })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            transitionForms('.signup-container', '.login-container')
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
