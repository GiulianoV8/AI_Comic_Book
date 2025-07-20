document.addEventListener("DOMContentLoaded", function () {
	// if (window.location.href.indexOf("localhost") > -1) {
	// 	localStorage.setItem("userID", '1002');
	// 	window.location.replace("/home.html");
	// }
	
	document.querySelector(".login-container").style.display = "block";
	setTimeout(() => {
		document.querySelector(".login-container").classList.add("show");
	}, 10);
	document
		.querySelector("form#loginForm")
		.addEventListener("submit", (event) => {
			event.preventDefault();
			const username = document.querySelector("#username").value;
			const password = document.querySelector("#password").value;
			
			// disable login button to prevent multiple clicks
			const loginButton = document.querySelector("#loginBtn");
			loginButton.disabled = true;
			authenticate(username, password);
			// enable login button after authentication
			loginButton.disabled = false;
		});

	document.getElementById("signUpButton").addEventListener("click", () => {
		transitionForms(".login-container", ".signup-container");
	});

	document
		.getElementById("backToLogin-button")
		.addEventListener("click", () => {
			transitionForms(".signup-container", ".login-container");
		});

	document
		.querySelector(".forgot-password-link")
		.addEventListener("click", () => {
			transitionForms(".login-container", ".recover-password-container");
		});

	document
		.getElementById("backToSignUp-button")
		.addEventListener("click", () => {
			transitionForms(".attributes-container", ".signup-container");
		});

	document
		.getElementById("backToLoginFromRecover")
		.addEventListener("click", function () {
			transitionForms(".recover-password-container", ".login-container");
		});

	const captureBtn = document.getElementById("capture-btn");
	const generateContainer = document.getElementById("generate-container");
	const confirmAvatarBtn = document.getElementById("confirm-avatar-btn");
	const generateAvatarBtn = document.getElementById("generate-avatar-btn");
	const avatarContainer = document.getElementById("avatar-container");
	const arrow = document.getElementById("down-arrow");
	const video = document.getElementById("webcam");
	const canvas = document.getElementById("output-canvas");
	const avatarImage = document.getElementById("avatar-image");
	const uploadImageLabel = document.getElementById("upload-image-label");
    const uploadImageInput = document.getElementById("upload-image-input");
	const uploadedImage = document.getElementById("uploaded-image");
	const loadingContainer = document.getElementById("loading-container");
	const takePictureBtn = document.getElementById("take-picture-btn");

	takePictureBtn.addEventListener("click", async () => {
		if (takePictureBtn.innerHTML == "Take a picture of yourself to create your superhero avatar!") {
			takePictureBtn.innerHTML = "Cancel"
			uploadImageInput.value = ""; // Clear the file input
			uploadedImage.src = ""; // Clear the uploaded image source
			uploadedImage.style.display === "none";
			//Show capture button
			captureBtn.style.display = "block";
			//Show webcam
			video.style.display = "block";
			//Hide uploaded image
			uploadedImage.style.display = "none";
			//Show canvas
			canvas.style.display = "none";

			// Hide file input and label
			uploadImageInput.style.display = "none";
			uploadImageLabel.style.display = "none";

			await startWebcam();
		} else if (takePictureBtn.innerHTML == "Cancel") {
			takePictureBtn.innerHTML = "Take a picture of yourself to create your superhero avatar!";
			// Hide video and canvas
			video.style.display = "none";
			canvas.style.display = "none";
			captureBtn.style.display = "none";

			// Hide the generate avatar section
			generateContainer.style.display = "none";
			avatarContainer.style.display = "none";

			// Stop webcam stream
			if (video.srcObject) {
				const tracks = video.srcObject.getTracks();
				tracks.forEach((track) => track.stop());
				video.srcObject = null;
			}

			// show file input and label
			uploadImageInput.style.display = "block";
			uploadImageLabel.style.display = "block";
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
				generateAvatarBtn.disabled = false;
			};
			reader.readAsDataURL(file);
		}
	});

	// Start webcam
	async function startWebcam() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
			});
            video.style.display = "block";
			video.srcObject = stream;
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
			generateAvatarBtn.innerHTML === "Generate Superhero Avatar";
			generateAvatarBtn.disabled = false;
		} else {
			// Retake photo
			video.style.display = "block";
			canvas.style.display = "none";
			captureBtn.innerHTML = "Capture Photo";

			// Hide the generate avatar section
			generateContainer.style.display = "none";
			generateAvatarBtn.disabled = true;
			avatarContainer.style.display = "none";
		}
	});

	// Generate or Regenerate Avatar
	generateAvatarBtn.addEventListener("click", async () => {
		generateAvatarBtn.disabled = true;
		// Show the loading animation
		loadingContainer.style.display = "block";

		const username = document.getElementById("newUsername").value.trim();

		let imageBlob = null;
		const ctx = canvas.getContext("2d");
		const pixel = ctx.getImageData(0, 0, 1, 1).data;
		const isNotBlank = pixel[3] !== 0; // alpha channel not zero means something was drawn
		const isCanvasVisible = canvas.style.display !== "none";

		if (uploadedImage.files && uploadedImage.files.length > 0) {
			// Use the uploaded image
			const response = await fetch(uploadedImage.src);
			imageBlob = await response.blob();
		} else if (isCanvasVisible && isNotBlank) {
			// Use the captured image from the canvas
			imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg"));
		} else {
			// No image available, show an error or handle accordingly
			alert("Please upload an image or take a photo to generate your avatar.");
			generateAvatarBtn.disabled = false;
			loadingContainer.style.display = "none";
			return;
		}
		console.log("imageBlob:", imageBlob);

		// Generate the superhero avatar
		const avatarResult = await generateSuperheroAvatar(username, imageBlob);

		// Hide the loading animation
		loadingContainer.style.display = "none";

		if (avatarResult) {
			// Show avatar container
			avatarContainer.style.display = "block";

			// Display avatar preview
			avatarImage.style.display = "block";
			avatarImage.src = avatarResult;

			// Hide the generate section
			const arrow = document.getElementById("down-arrow");
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

		const attributes = {
			gender: genderField === "Non-binary" ? "" : genderField,
			age: document.getElementById("age").value < 21 ? "young" : `${document.getElementById("age").value} year old`,
		};

		const prompt = `A bold comic book illustration of this ${attributes.age} ${attributes.gender} person as a superhero, 
		hyper-stylized with ink outlines, Ben-Day dots, and vibrant primary colors. 
		Dynamic superhero pose with exaggerated perspective (e.g., foreshortened fists or flying motion), 
		${isNaN(attributes.age) ? 'youthful, energetic' : 'powerful, commanding'} facial expression, 
		and a comic-book-style halftone background. 
		Inspired by [Artists: Stan Lee/Jim Lee/Jack Kirby], with dramatic lighting and action lines for motion effects.`;

		const formData = new FormData();
		formData.append("username", username);
		formData.append("userID", '_');
        formData.append("prompt", prompt);
        formData.append("createAvatar", true);
		formData.append("image", blob, blob.mimetype); // Append the Blob with a filename
		formData.append("description", '_');
		formData.append("temporary", false);

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

	// Confirm button saves avatar
	confirmAvatarBtn.addEventListener("click", async () => {
		// disable the button to prevent multiple clicks
		confirmAvatarBtn.disabled = true;
		let genderField = document.getElementById("gender").value;
		let gender = genderField == "Non-binary" ? "" : genderField;
		
        const attributes = {
			gender: gender,
			age: document.getElementById("age").value,
		};

		await submitSignUp(
			document.getElementById("newUsername").value,
			document.getElementById("newEmail").value,
			document.getElementById("newPassword").value,
			attributes
		);
		// enable the button after submission
		confirmAvatarBtn.disabled = false;
	});

	document.getElementById("recoverPasswordForm").addEventListener("submit", async function (e) {
			e.preventDefault();
			const recoveryEmail =
				document.getElementById("recoveryEmail").value;

			// Simulate showing the success message
			const recoveryMessage = document.getElementById("recoveryMessage");
			recoveryMessage.textContent = `Password will be sent to ${recoveryEmail}`;
			recoveryMessage.style.color = "green";
			recoveryMessage.style.display = "block";

			try {
				const response = await fetch("/recover-password", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email: recoveryEmail }),
				});

				const recoveryMessage =
					document.getElementById("recoveryMessage");

				const result = await response.json();
				if (response.ok) {
					// Show success message
					recoveryMessage.style.color = "green";
					recoveryMessage.textContent = result.message;
				} else {
					// Show error message
					recoveryMessage.style.color = "red";
					recoveryMessage.textContent = `Error sending recovery email to ${recoveryEmail}.`;
				}
				recoveryMessage.style.display = "block";
			} catch (error) {
				console.error("Error:", error);
			}
		});

	document.querySelector("#continue-sign-up-btn").addEventListener("click", (event) => {
			event.preventDefault();
			// if fields not filled out, deny
			const usernameField = document.getElementById("newUsername").value.trim();
			const emailField = document.getElementById("newEmail").value.trim();
			const passwordField = document.getElementById("newPassword").value.trim();

			if (!usernameField || !emailField || !passwordField) {
				return; // Halt workflow
			}
			fetch("/check-username", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: usernameField,
					email: emailField,
				}),
			})
				.then((response) => response.json())
				.then((data) => {
					if (data.emailExists) {
						emailField.style.color = "red";
						emailField.value = "Email Already In Use!";
						emailField.onclick = () => {
							emailField.style.color = "black";
							emailField.value = "";
						};
					}
					if (data.usernameExists) {
						usernameField.style.color = "red";
						usernameField.value = "Username Already In Use!";
						usernameField.onclick = () => {
							usernameField.style.color = "black";
							usernameField.value = "";
						};
					}

					if ((!data.usernameExists && !data.emailExists) || !data.error) {
						transitionForms(
							".signup-container",
							".attributes-container"
						);
					}
				});
		});
});

async function authenticate(username, password) {
	await fetch("/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ username, password }),
	})
		.then((response) => response.json())
		.then((data) => {
			if (data.success) {
				localStorage.setItem("userID", data.userID);
				window.location.replace("/home.html");
			} else {
				const usernameInput = document.getElementById("username");
				if (data.success == false) {
					usernameInput.value = "Wrong Username Or Password!";
				}
				usernameInput.style.color = "red";
				usernameInput.addEventListener("click", () => {
					usernameInput.style.color = "black";
					usernameInput.value = "";
				});
				if (data.success == 'error') {
					usernameInput.value = "There was an error logging in";
					throw new Error("There was an error logging in");
				}
			}
		})
		.catch((error) => {
			// Could not login
			console.error("Error:", error);
			alert("There was an error logging in. Please try again.");
		});
}

async function submitSignUp(newUsername, newEmail, newPassword, attributes) {
	await fetch("/signup", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username: newUsername,
			email: newEmail,
			password: newPassword,
			attributes: attributes,
			comicTitle: `${newUsername}'s Great Adventure`,
		}),
	})
		.then((response) => response.json())
		.then((data) => {
			if (data.success) {
				// Redirect to home.html after successful upload
				localStorage.setItem("userID", data.userID);
				window.location.href = "./home.html";
			}
		})
		.catch((error) => {
			console.error("Error:", error);
			alert("There was an error signing up. Please try again.");
		});
}

function transitionForms(hideSelector, showSelector) {
	document.querySelector(hideSelector).classList.remove("show");
	setTimeout(() => {
		document.querySelector(hideSelector).style.display = "none";
		document.querySelector(showSelector).style.display = "block";
		setTimeout(() => {
			document.querySelector(showSelector).classList.add("show");
		}, 10);
	}, 500);
}
