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

    document.querySelector('.forgot-password-link').addEventListener('click', function() {
        transitionForms('.login-container', '.recover-password-container');
    });

    document.getElementById('backToSignUp-button').addEventListener('click', () => {
        transitionForms('.attributes-container', '.signup-container');
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
        generateAvatarBtn.disabled = true;
        const username = document.getElementById('newUsername').value.trim();
        // const imageBlob = await generateSuperheroAvatar(username);
        if (generateAvatarBtn.innerHTML === "Generate Superhero Avatar") {
            generateAvatarBtn.innerHTML = "Regenerate Avatar";
        }
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

    // Confirm button saves avatar
    confirmAvatarBtn.addEventListener('click', async () => {
        const username = document.getElementById('newUsername').value.trim();

        const blobresponse = await fetch(avatarImage.src);
        const blob = await blobresponse.blob();
    
        let data = await uploadUserPhoto(blob, username);
        
        if (data.success) {
            console.log('Avatar uploaded successfully:', data.url);

            let genderField = document.getElementById('gender').value;
            let gender = (genderField == "Non-binary")? "" : genderField
            
            const attributes = {
                gender: gender,
                age: document.getElementById('age').value,
            };
            
            await submitSignUp(document.getElementById('newUsername').value, document.getElementById('newEmail').value, document.getElementById('newPassword').value, attributes);
            // Redirect to home.html after successful upload
            window.location.href = "./home.html";
        } else {
            console.error('Upload failed:', data.message);
        }
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
    

    document.querySelector('continue-sign-up-btn').addEventListener('click', event => {
        event.preventDefault();
        fetch('/check-username', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: document.getElementById('newUsername').value,
                email: document.getElementById('newEmail').value
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

async function submitSignUp(newUsername, newEmail, newPassword, attributes) {
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
            transitionForms('.attributes-container', '.login-container')
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
