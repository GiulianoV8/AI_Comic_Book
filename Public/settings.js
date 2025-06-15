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

    let avatarImage = document.getElementById('avatar-image');

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
            avatarImage.src = data.avatarUrl;
            avatarImage.style.display = 'block';
        } catch (error) {
            console.error('Error fetching avatar url:', error);
        }

    }
    
    const captureBtn = document.getElementById('capture-btn');
    const generateContainer = document.getElementById('generate-container');
    const generateAvatarBtn = document.getElementById('generate-avatar-btn');
    const avatarContainer = document.getElementById('avatar-container');
    const cameraContainer = document.getElementById('camera-container');
    const arrow = document.getElementById('down-arrow');
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('output-canvas');
    const avatarDisplayImage = document.getElementById('avatar-display-image');
    const takePicBtn = document.getElementById('take-picture-btn');
    const uploadImageInput = document.getElementById("upload-image-input");
	const uploadedImage = document.getElementById("uploaded-image");

    // Start webcam
    async function startWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.style.display = "block";
        } catch (error) {
            console.error("Error accessing webcam:", error);
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

    // Handle image upload
	uploadImageInput.addEventListener("change", (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				// Display the uploaded image
				uploadedImage.src = e.target.result;
				uploadedImage.style.display = "block";

				// Hide the video and canvas
				video.style.display = "none";
				canvas.style.display = "none";
                captureBtn.style.display = "none";

                // Show the generate avatar section
                generateContainer.style.display = "block";
                generateAvatarBtn.innerHTML === "Generate Superhero Avatar";
			};
			reader.readAsDataURL(file);
		}
	});

    takePicBtn.addEventListener('click', async () => {
        if(takePicBtn.innerHTML == "Change Avatar?"){
            takePicBtn.innerHTML = "Cancel";
            avatarImage.style.display = "none";
            cameraContainer.style.display = "block";
            await startWebcam();
            
            //Show capture button
            captureBtn.style.display = "block";
            //Show webcam
            video.style.display = "block";
            //Show canvas
            canvas.style.display = "none";
        }else{
            // Cancel avatar change
            uploadImageInput.value = ""; // Clear the file input
            uploadedImage.src = ""; // Clear the uploaded image source
            uploadedImage.style.display === "none";
            generateContainer.style.display = "none";
            avatarContainer.style.display = "none";
            cameraContainer.style.display = "none";
            takePicBtn.innerHTML = "Change Avatar?";
            avatarImage.style.display = "block";
            // Send request to backend to delete the avatar
            try {
                const response = await fetch(`/deleteAvatar?username=${localStorage.getItem('username')}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    console.error("Failed to delete avatar");
                }
            } catch (error) {
                console.error("Error deleting avatar:", error);
            }
        }
    });
   
    // Generate or Regenerate Avatar
    generateAvatarBtn.addEventListener("click", async () => {
        generateAvatarBtn.disabled = true;
        // Show the loading animation
		loadingContainer.style.display = "block";

        const username = localStorage.getItem("username");

        let imageBlob;
        if (avatarDisplayImage.style.display === "block") {
            // Use the uploaded image
            const response = await fetch(avatarDisplayImage.src);
            imageBlob = await response.blob();
        } else {
            // Use the captured image from the canvas
            imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg"));
        }
        console.log("imageBlob:", imageBlob);

        // Pass the image to the generateSuperheroAvatar function
        const avatarResult = await generateSuperheroAvatar(username, imageBlob);

        // Hide the loading animation
		loadingContainer.style.display = "none";

        if (avatarResult) {
            // Show avatar container
			avatarContainer.style.display = "block";

            avatarDisplayImage.src = avatarResult;
            avatarDisplayImage.style.display = "block";

            // Show avatar image and container
            avatarContainer.style.display = "block";

            // Hide generate section
            arrow.style.display = "none";
        }

        if (generateAvatarBtn.innerHTML === "Generate Superhero Avatar") {
            generateAvatarBtn.innerHTML = "Regenerate Avatar";
        }
        generateAvatarBtn.disabled = false;
    });

    // Generate superhero avatar
    async function generateSuperheroAvatar(username, blob) {
        console.log("Generating superhero avatar...");

        let genderField = document.getElementById("gender").value;
        let gender = genderField === "Non-binary" ? "" : genderField;

        const attributes = {
            gender: gender,
            age: document.getElementById("age").value < 21 ? "young" : `${document.getElementById("age").value} year old`,
        };

        const prompt = `A bold comic book illustration of this ${attributes.age} ${attributes.gender} person as a superhero, 
		hyper-stylized with ink outlines, Ben-Day dots, and vibrant primary colors. 
		Dynamic superhero pose with exaggerated perspective (e.g., foreshortened fists or flying motion), 
		${attributes.age < 21 ? 'youthful, energetic' : 'powerful, commanding'} facial expression, 
		and a comic-book-style halftone background. 
		Inspired by [Artists: Stan Lee/Jim Lee/Jack Kirby], with dramatic lighting and action lines for motion effects.`;

		const formData = new FormData();
		formData.append("username", username);
		formData.append("userID", '_');
        formData.append("prompt", prompt);
        formData.append("createAvatar", true);
		formData.append("image", blob, blob.mimetype); // Append the Blob with a filename
		formData.append("description", '_');
        formData.append("temporary", true);

        try {
			console.log("sending blob:", blob); // Frontend
			const response = await fetch("/generatePhoto", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				console.error("Failed to generate avatar");
				return './svgs/errorwarning.webp';
			}

			return await response.imageUrl; // Return the generated avatar blob
		} catch (error) {
			console.error("Error in generateSuperheroAvatar:", error);
			return './svgs/errorwarning.webp';
		}
    }

    attributeForm.onsubmit = async function(event) {
        event.preventDefault();

        let genderField = document.getElementById("gender").value;
        
        const attributes = {
            gender: genderField === "Non-binary" ? "" : genderField,
			age: document.getElementById("age").value < 21 ? "young" : document.getElementById("age").value,
        };
        
        localStorage.setItem('attributes', JSON.stringify(attributes));

        try {
            // Send attributes to the backend
            const editResponse = await fetch('/editAttributes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID, attributes })
            });

            // Send backend request to switch avatar, no need to pass data
            const avatarResponse = await fetch(`/switchAvatar?username=${localStorage.getItem('username')}`, {
                method: 'POST'
            });

            if (editResponse.ok && avatarResponse.ok) {
                closeModals();
            }
        } catch (error) {
            console.error('Error:', error);
        }
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
