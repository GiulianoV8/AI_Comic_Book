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
    

    const video = document.getElementById('webcam');
    const canvas = document.getElementById('output-canvas');
    const captureBtn = document.getElementById('capture-btn');
    const avatarImage = document.getElementById('avatar-image');
    const ctx = canvas.getContext('2d');
    const arrow = document.getElementById('down-arrow');
    const generateContainer = document.getElementById('generate-container');
    const generateAvatarBtn = document.getElementById('generate-avatar-btn');
    const confirmAvatarBtn = document.getElementById('confirm-avatar-btn');
    
    // Start webcam and continuously detect face
    async function startWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
        } catch (error) {
            console.error('Error accessing webcam:', error);
        }
    }

    captureBtn.addEventListener('click', () => {
        if (captureBtn.innerHTML === 'Capture Photo') {
            // Capture photo
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
            // Toggle visibility
            video.style.display = 'none';
            canvas.style.display = 'block';
    
            // Change button text to Retake
            captureBtn.innerHTML = 'Retake?';
    
            // Show avatar generation UI
            generateContainer.style.display = 'block';
        } else {
            // Retake photo
            video.style.display = 'block';
            canvas.style.display = 'none';
    
            // Reset button text
            captureBtn.innerHTML = 'Capture Photo';
    
            // Hide avatar generation UI
            generateContainer.style.display = 'none';
        }
    });
    
    // Clicking arrow or button triggers AI avatar generation
    generateAvatarBtn.addEventListener('click', async () => {
        const username = document.getElementById('newUsername').value.trim();
        // const imageBlob = await generateSuperheroAvatar(username);
    
        if (imageBlob) {
            // Display avatar preview
            const avatarURL = URL.createObjectURL(imageBlob);
            avatarImage.src = avatarURL;
            avatarImage.style.display = 'block';
    
            // Show confirm button
            confirmAvatarBtn.style.display = 'block';
    
            // Hide generate section
            generateContainer.style.display = 'none';
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
    
    // Upload image to backend
    async function uploadUserPhoto(username, image) {
        console.log('Requesting presigned URL...');
    
        const response = await fetch('/getPresignedUrl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
    
        const data = await response.json();
        if (!data.success) {
            console.error('Failed to get presigned URL');
            return;
        }
    
        // Upload image to S3
        console.log(`Uploading image to S3...`);
        await uploadToS3(image, data.url);
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
    
    // Upload image to S3
    async function uploadToS3(blob, presignedUrl) {
        try {
            await fetch(presignedUrl, {
                method: 'PUT',
                body: blob,
                headers: { 'Content-Type': 'image/png' },
            });
            return true;
        } catch (error) {
            console.error('Upload error:', error);
            return false;
        }
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
