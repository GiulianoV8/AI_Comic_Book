let openModal;
let modalDisabled = false;
document.addEventListener("DOMContentLoaded", function() {
    function isLocalStorageEnabled() {
        const testKey = "testkey";
    
        try {
            // Try setting an item in localStorage
            localStorage.setItem(testKey, "test");
    
            // Try reading the item back
            const value = localStorage.getItem(testKey);
    
            // Remove the item after testing
            localStorage.removeItem(testKey);
    
            return value === "test";
        } catch (e) {
            return false;
        }
    }

    for(let i = 0; i < 22; i++) {
        // createPanel('https://upload.wikimedia.org/wikipedia/commons/6/63/Icon_Bird_512x512.png', true, i);
    }
    

    const xBtn = document.getElementById("xBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const dropdown = document.getElementById('deleteDropdown');
    let deleteMode = false;
    let selectedItems = [];

    const gridContainer = document.getElementById("gridContainer");
    const addPanelBtn = document.getElementById("addPanelBtn");
    const deletePanelBtn = document.getElementById("deletePanelBtn");
    const deleteConfirmDropdown = document.getElementById("deleteConfirmDropdown");
    const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

    const comicTitle = document.getElementById("comic-title");
    const editTitleBtn = document.getElementById("edit-title-btn");
    const saveTitleBtn = document.getElementById("save-title-btn");
    const cancelTitleBtn = document.getElementById("cancel-title-btn");

    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("imageCaption");
    const closeBtn = document.getElementsByClassName("close")[0];

    const createBtn = document.getElementById("createBtn-container");

    const steps = [
        { element: '#createBtn', content: 'This is your superhero diary. Whether you are going for a run, cooking lunch, or doing homework, you can record it, because everything you do is a daily heroic.' },
        { element: '#addPanelBtn', content: 'Adding an event: This is where you record an event. Click "Add Panel" to add a comic panel. Then click one of the + buttons to select the placement of your event. Once a panel is created, enter a description of your event (I cooked breakfast, ran in the park, etc.) in the input field and click the pencil button. Alternatively, you can press the microphone button and speak into your device to record your event Let the image load, and you will have superhero you doing that event.' },
        { element: '#deletePanelBtn', content: 'Deleting an event: AI is not perfect, and will therefore not produce a perfect image every time. So, if you don\'t like the image generated or you made a mistake, you can delete the panel. Click the "Delete Panel" button and select unwanted panels. Once selected, you can click "Delete Selected" to delete the selected panels.' },
        { element: '#createBtn-container', content: 'Viewing your comic: At the end of the day, when you have recorded all of your events, you can view your comic. Click the "Create" button to view your daily heroics! ' }
    ];

    let currentStep = 0;
    
    const tutorialPopup = document.getElementById('tutorialPopup');
    const tutorialContent = document.getElementById('tutorialContent');
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    const nextStepButton = document.getElementById('nextStep');
    const prevStepButton = document.getElementById('prevStep');
    const skipButton = document.getElementById('skipTutorial');
    const comicBackground = document.getElementById('comic-background');

    hideTutorial();
    function resetTutorials() {
        if(addPanelBtn.innerHTML == "Exit Add Panel Mode") {
            addPanelBtn.click();
        }
        if(deletePanelBtn.innerHTML == "Exit delete panel mode") {
            deletePanelBtn.click();
        }
        addPanelBtn.removeEventListener('click', showPlusClickEvent);
        addPanelBtn.style.zIndex = '';
        document.querySelectorAll('.grid-item:not(.create)').forEach(elem => elem.style.zIndex = '');
        deletePanelBtn.style.zIndex = '';
        document.getElementById("deleteConfirmDropdown").style.zIndex = '';
        comicBackground.style.zIndex = '2';
        createBtn.style.zIndex = '1';
        document.querySelectorAll(".circle").forEach(elem => elem.style.zIndex = '3');
        document.querySelectorAll('.grid-item:not(.create)').forEach(elem => {
            elem.style.zIndex = '';
            modalDisabled = false;
        });
        document.querySelectorAll('.plus-button').forEach((element) => {
            element.style.zIndex = '';
            element.removeEventListener('click', showPanelsEvent);
        });
        nextStepButton.innerText = "Next";
    }
    function showPanelsEvent() {
        document.querySelectorAll('.grid-item:not(.create)').forEach(elem => {
            elem.style.zIndex = '1000';
            modalDisabled = true;
        });
    }
    function showPlusClickEvent() {
        document.querySelectorAll('.plus-button').forEach((element) => {
            element.style.zIndex = '1000';
            element.addEventListener('click', showPanelsEvent);
        });
    }
    function showStep(stepIndex) {
        const step = steps[stepIndex];
        const targetElement = document.querySelector(step.element);
        
        tutorialContent.textContent = step.content;
        tutorialPopup.style.display = 'block';
        tutorialOverlay.style.display = 'block';

        switch(stepIndex) {
            case 0: // intro
                resetTutorials();
                break;
            case 1: // add panel
                resetTutorials();
                showPanelsEvent();
                showPlusClickEvent();
                targetElement.onclick = showPlusClickEvent;
                break;
            case 2: // delete panel
                resetTutorials();
                showPanelsEvent();
                document.getElementById("deleteConfirmDropdown").style.zIndex = '1000';
                break;
            case 3: // create buttom
                resetTutorials();
                targetElement.style.zIndex = '1000';
                comicBackground.style.zIndex = '1001';
                break;
        }
        targetElement.style.zIndex = '1000';
        
        // Enable or disable navigation buttons
        prevStepButton.disabled = stepIndex === 0;
        if(stepIndex === steps.length - 1) {
            nextStepButton.innerText = "Let's Go!";
        }
    }

    function hideTutorial() {
        resetTutorials();
        tutorialPopup.style.display = 'none';
        tutorialOverlay.style.display = 'none';
        currentStep = 0;
        nextStepButton.innerText = 'Next';
    }

    nextStepButton.addEventListener('click', () => {
        if(nextStepButton.innerText === "Let's Go!") {
            hideTutorial();
        } else {
            currentStep++;
            showStep(currentStep);
        }
    });

    prevStepButton.addEventListener('click', () => {
        currentStep--;
        showStep(currentStep);
    });

    skipButton.addEventListener('click', hideTutorial);

    document.getElementById('questionBtn').addEventListener('click', () => {
        currentStep = 0;
        showStep(currentStep);
    });
    

    if(!localStorage.getItem('userID')){
        window.location.replace("/login.html");
    }
    userID = localStorage.getItem("userID");
    fillData(userID);    

    if(!isLocalStorageEnabled) {
        document.getElementById("noLocalStorageBackground").classList.add('hidden');
        console.log('storage not enabled');
    }

    document.getElementById("createBtn").addEventListener("click", showComicPanels);
    document.querySelector(".close-overlay").addEventListener("click", closeComicPanels);

    function showComicPanels() {
        if(addPanelBtn.innerHTML == "Exit Add Panel Mode") {
            addPanelBtn.click();
        }
        if(deletePanelBtn.innerHTML == "Exit delete panel mode") {
            deletePanelBtn.click();
        }

        const comicBackground = document.getElementById("comic-background");
        const comicGrid = document.querySelector(".comic-grid");
        const comicDisplayTitle = document.getElementById("comic-display-title");
    
        comicDisplayTitle.innerText = document.getElementById("comic-title").innerText;
        
        const imageUrls = JSON.parse(localStorage.getItem('imageUrls')) || [];
        const imageDescriptions = JSON.parse(localStorage.getItem('imageDescriptions')) || [];

        let currentIndex = 0;
        let previousRow;

        while (currentIndex < imageUrls.length) {
            // Randomly decide whether the row will have 2 or 3 panels
            let numPanelsInRow = Math.random() < 0.55 ? 2 : 3;

            // Check if it's the second-to-last row and only one image remains
            if (imageUrls.length - currentIndex === 3 && previousRow) {
                numPanelsInRow = 3; // Force the last row to have 3 panels if 3 images remain
            }
            if(currentIndex == 0){
                numPanelsInRow = 2; // Force the first row to have 2 panels
            }

            // Create a new row
            const row = document.createElement('div');
            row.classList.add('row');
            row.classList.add(`row-${numPanelsInRow}`); // Add class to style appropriately

            // Add panels to the row
            for (let i = 0; i < numPanelsInRow && currentIndex < imageUrls.length; i++) {
                const imageUrl = imageUrls[currentIndex];
                const captionText = imageDescriptions[currentIndex];

                // Create the panel with random caption positioning
                const panel = createComicPanel(imageUrl, captionText);
                row.appendChild(panel);

                currentIndex++;
            }

            // Add the row to the grid
            comicGrid.appendChild(row);

            // Keep track of the previous row for special case handling
            previousRow = row;
        }
        
        comicBackground.classList.remove("hidden");
    }
    
    function createComicPanel(imageUrl, captionText) {
        const panel = document.createElement('div');
        panel.classList.add('comic-panel');
    
        const content = document.createElement('div');
        content.classList.add('panel-content');
    
        // Randomly decide whether to put caption above or below
        const isCaptionOnTop = Math.random() < 0.5; // 50% chance
    
        const caption = document.createElement('div');
        caption.classList.add('panel-caption', isCaptionOnTop ? 'top' : 'bottom'); // Add top or bottom class
        caption.textContent = !captionText ? '' : captionText;
    
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = "Comic Image";
        image.classList.add('panel-image');
    
        // Append elements based on caption position
        if (isCaptionOnTop) {
            content.appendChild(caption); // Add caption first
            content.appendChild(image); // Add image second
        } else {
            content.appendChild(image); // Add image first
            content.appendChild(caption); // Add caption second
        }
    
        panel.appendChild(content);
        return panel;
    }

    function closeComicPanels() {
        const comicGrid = document.querySelector(".comic-grid");
        comicGrid.innerHTML = "";

        document.getElementById("comic-background").classList.add("hidden");
        
        document.body.style.overflow = 'auto'; // Enable page scrolling
    }

    let previousTitle = comicTitle.innerText;

    let plusButtons = [];
    let addPanelMode = false;

    // Function to show plus buttons
    function showPlusButtons() {
        if (!addPanelMode) return;

        const gridItems = document.querySelectorAll(".grid-item:not(.create)");
        plusButtons.forEach(button => button.remove());  // Clear existing buttons
        
        // Create plus buttons before each item, between items, and after the last item
        gridItems.forEach((item, index) => {
            const plusBtn = createPlusButton(index);
            gridContainer.insertBefore(plusBtn, item);
            plusButtons.push(plusBtn);
        });

        // Add plus button after the last item and before the ".create" button
        const lastPlusBtn = createPlusButton(gridItems.length);
        const createItem = document.querySelector('.create');
        gridContainer.insertBefore(lastPlusBtn, createItem);
        plusButtons.push(lastPlusBtn);
    }

    // Function to create a plus button
    function createPlusButton(position) {
        const plusBtn = document.createElement("button");
        plusBtn.classList.add("plus-button");
        plusBtn.innerText = "+";
        plusBtn.addEventListener("click", function() {
            createPanel("imgs/blank_white.jpeg", false, position);
            hidePlusButtons();
        });
        return plusBtn;
    }

    // Function to hide plus buttons
    function hidePlusButtons() {
        plusButtons.forEach(button => button.remove());
        plusButtons = [];
        addPanelMode = false;
        addPanelBtn.innerText = "Add Panel";  // Revert button text
        deletePanelBtn.style.pointerEvents = "auto";
    }

    // Function to close modal
    closeBtn.onclick = function () {
        modal.style.display = "none";
    }
    
    // Function to open modal
    openModal = (imageUrl, description, event) => {
        if(!modalDisabled){
            if(!event.target.classList.contains("circle")){
                if(addPanelBtn.innerHTML == "Exit Add Panel Mode") {
                    addPanelBtn.click();
                }
                if(deletePanelBtn.innerHTML == "Exit delete panel mode") {
                    deletePanelBtn.click();
                }
                modal.style.display = "block";
                modalImg.src = imageUrl;
                captionText.innerHTML = description ? description : "";
            }
        }
    }

    // Toggle add panel mode on "Add Panel" button click
    addPanelBtn.addEventListener("click", function() {
        addPanelMode = !addPanelMode;
        if (addPanelMode) {
            deletePanelBtn.style.pointerEvents = "none";
            showPlusButtons();
            addPanelBtn.innerText = "Exit Add Panel Mode";  // Change button text
        } else {
            deletePanelBtn.style.pointerEvents = "auto";
            hidePlusButtons();
            addPanelBtn.innerText = "Add Panel";  // Revert button text
        }
    });

    // Function to enable editing
    editTitleBtn.addEventListener("click", function() {
        previousTitle = comicTitle.innerText;
        comicTitle.contentEditable = true;
        comicTitle.focus();
        editTitleBtn.style.display = "none";
        saveTitleBtn.style.display = "inline-block";
        cancelTitleBtn.style.display = "inline-block";
    });

    // Function to cancel editing
    cancelTitleBtn.addEventListener("click", function() {
        comicTitle.innerText = previousTitle;
        comicTitle.contentEditable = false;
        editTitleBtn.style.display = "inline-block";
        saveTitleBtn.style.display = "none";
        cancelTitleBtn.style.display = "none";
    });

    // Function to save the new title
    saveTitleBtn.addEventListener("click", async function() {
        const newTitle = comicTitle.innerText.trim();
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
                previousTitle = newTitle;
                comicTitle.contentEditable = false;
                editTitleBtn.style.display = "inline-block";
                saveTitleBtn.style.display = "none";
                cancelTitleBtn.style.display = "none";
            } else {
                newTitle.innerText = 'Error updating title';
            }
            localStorage.setItem('comicTitle', newTitle);
        } else {
            newTitle.innerText = 'Please enter a title';
        }
    });

    // Toggle delete panel mode
    deletePanelBtn.addEventListener("click", function() {
        deleteMode = !deleteMode;
        deleteConfirmDropdown.classList.toggle('hidden');
        addPanelBtn.style.pointerEvents = deleteMode ? 'none' : 'auto';
        deletePanelBtn.innerText = deleteMode ? 'Exit delete panel mode' : 'Delete Panel';

        if (deleteMode) {
            document.querySelectorAll(".grid-item").forEach(item => {
                if (!item.classList.contains("create") && !item.querySelector(".circle")) {
                    let circle = document.createElement("div");
                    circle.classList.add("circle");
                    circle.style.display = "block"; // Make sure circle is visible
                    item.appendChild(circle);
                }
            });
        } else {
            hideDeletePanels();
        }
    });

    // Event delegation for click events on the grid container
    document.querySelector(".grid-container").addEventListener("click", function(event) {
        if (deleteMode && event.target.classList.contains("circle")) {
            let circle = event.target;
            circle.classList.toggle("selected");
            circle.parentElement.classList.toggle("highlight");

            if (circle.classList.contains("selected")) {
                selectedItems.push(circle.parentElement);
            } else {
                selectedItems = selectedItems.filter(item => item !== circle.parentElement);
            }
        }
    });

    // Confirm deletion of selected panels
    deleteConfirmBtn.addEventListener("click", async function() {
        deleteConfirmDropdown.classList.add('hidden');
        
        let imageDescriptions = JSON.parse(localStorage.getItem("imageDescriptions"));
        let imageUrls = JSON.parse(localStorage.getItem("imageUrls"));

        for (let item of selectedItems) {
            let imgUrl = item.querySelector(".generated-image").src;
            let index = imageUrls.indexOf(imgUrl);
            if (index > -1) {
                imageDescriptions.splice(index, 1);
                imageUrls.splice(index, 1);
            }
            item.remove();
        }

        localStorage.setItem("imageDescriptions", JSON.stringify(imageDescriptions));
        localStorage.setItem("imageUrls", JSON.stringify(imageUrls));
        await saveImage(localStorage.getItem('userID'));

        hideDeletePanels();
        deletePanelBtn.innerText = 'Delete Panel';
        addPanelBtn.style.pointerEvents = 'auto';
        deleteMode = false;
    });

    // Hide and reset delete panels
    function hideDeletePanels() {
        document.querySelectorAll(".grid-item .circle").forEach(circle => circle.remove());
        document.querySelectorAll(".grid-item").forEach(item => item.classList.remove("highlight"));
        selectedItems = [];
    }

    // Delete all panels except "Create" on "Rewrite" button click
    xBtn.addEventListener("click", function() {
        dropdown.classList.toggle('hidden');
    });

    deleteBtn.addEventListener("click", async function() {
        dropdown.classList.add('hidden');
        const gridItems = gridContainer.querySelectorAll(".grid-item:not(.create)");
        for (let item of gridItems) {
            let img = item.querySelector('.generated-image');
            if (img && img.src) {
                item.remove();
            }
        }
        localStorage.setItem('imageDescriptions', JSON.stringify([]));
        await saveImage(localStorage.getItem('userID'));
    });

    // Prevent default form submission
    let forms = document.querySelectorAll(".input-container");
    forms.forEach(item => item.addEventListener("submit", e => e.preventDefault()));
});

let recognizingSpeech = false;

// Function to create a new panel at a specified position
function createPanel(src, image, position) {
    const newGridItem = document.createElement("div");
    newGridItem.classList.add("grid-item");

    if (image) {
        newGridItem.innerHTML = `<img class="generated-image" src=${src}>`;
        const imageUrl = src;
        const description = JSON.parse(localStorage.getItem('imageDescriptions'))[position];
        newGridItem.addEventListener('click', event => openModal(imageUrl, description, event));

    } else {
        newGridItem.innerHTML = `
            <div class="scribble-container">
                <img class="pencil hidden" src="imgs/pencil_icon_transparent.webp">
            </div>
            <img class="generated-image" src=${src}>
            <form class="input-container" onSubmit="submitEvent(this, description.value)">
                <textarea class="event-input" id="event-input-${position}" name="description" placeholder="Event" rows="1"></textarea>
                <button class="mic-button" id="mic-button-${position}" type="button">
                    <img src="imgs/mic_icon.png" alt="speak" class="mic-icon">
                </button>
                <button class="event-submit" type="submit">
                    <img src="imgs/pencil_icon.jpeg" alt="Submit" class="submit-image">
                </button>
            </form>
        `;
    }

    const gridItems = document.querySelectorAll(".grid-item");
    if (position < gridItems.length - 1) {
        gridContainer.insertBefore(newGridItem, gridItems[position]);
    } else {
        const createItem = document.querySelector('.create');
        gridContainer.insertBefore(newGridItem, createItem);
    }

    if (!image) {
        const LANG = "en-US";
        const recognition = new (window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.msSpeechRecognition)();
        recognition.lang = LANG;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById(`event-input-${position}`).value += ` ${transcript}`;
        };
        recognition.onstart = () => {
            recognizingSpeech = true;
            document.getElementById(`event-input-${position}`).placeholder = "Listening...";
            document.getElementById(`mic-button-${position}`).style.backgroundColor = "#00a6cb";

            // Disable all other mic buttons
            disableOtherMicButtons(position, true);
        };
        recognition.onend = () => {
            recognizingSpeech = false;
            document.getElementById(`event-input-${position}`).placeholder = "Event";
            document.getElementById(`mic-button-${position}`).style.backgroundColor = "#e8e8e8"; // Reset background color

            // Re-enable all mic buttons
            disableOtherMicButtons(position, false);
        };

        // Toggle between starting and stopping recognition
        document.getElementById(`mic-button-${position}`).addEventListener("click", () => {
            if (recognizingSpeech) {
                recognition.stop(); // Stop recognition if it's currently running
            } else {
                recognition.start(); // Start recognition if it's not running
            }
        });
    }
}

// Helper function to disable or enable other mic buttons
function disableOtherMicButtons(currentPosition, disable) {
    const micButtons = document.querySelectorAll(".mic-button");

    micButtons.forEach((button, index) => {
        if (index !== currentPosition) {
            button.disabled = disable; // Disable or enable the button based on the flag
            button.style.backgroundColor = disable ? "#cccccc" : ""; // Change button color to indicate disabled state
        }
    });
}


async function deleteImageUrl(imgSrc) {
    if (imgSrc === undefined) {
        return false;
    }

    let imageDescription = JSON.parse(localStorage.getItem('imageDescriptions'))[JSON.parse(localStorage.getItem('imageUrls')).indexOf(imgSrc)];
    
    try {
        // Send a request to delete the image URL from DynamoDB
        const response = await fetch('/deleteImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: localStorage.getItem('userID'),
                imageUrl: imgSrc,
                imgDescription: imageDescription
            })
        });
        const result = await response.json();
        if (result.success) {
            let imageUrls = JSON.parse(localStorage.getItem('imageUrls')) || [];
            updatedImageUrls = imageUrls.filter(url => !imgSrc.includes(url));
            localStorage.setItem('imageUrls', JSON.stringify(updatedImageUrls));

            let imageDescriptions = JSON.parse(localStorage.getItem('imageDescriptions')) || [];
            updatedImageDescriptions = imageDescriptions.filter(description => description !== imageDescription);
            localStorage.setItem('imageDescriptions', JSON.stringify(updatedImageDescriptions));
        } else {
            console.error("Error removing image from DynamoDB:", result.message);
        }
    } catch (error) {
        console.error("Error during deletion request:", error);
    }
}

async function fillData(userID) {
    try {
        // Clear current data
        localStorage.clear()
        localStorage.setItem('userID', userID);

        // Fetch user data from the backend
        const response = await fetch(`/getUserData?userID=${userID}`);
        const userData = await response.json();
        const data = userData.item;

        // Fill in the #comic-title input tag with the comicTitle attribute value
        const comicTitle = document.getElementById('comic-title');
        if (comicTitle && data.comicTitle) {
            comicTitle.innerText = data.comicTitle;
            localStorage.setItem('comicTitle', data.comicTitle);
        }

        // Handle imageUrls and imageDescriptions
        let imageUrls = data.imageUrls || [];
        let imageDescriptions = data.imageDescriptions || [];

        // Check if it's the first login of the day and reset images if true
        const resetImages = userData.firstLogin;
        if (resetImages === true) {
            imageUrls = [];
            imageDescriptions = [];
            localStorage.setItem('imageUrls', JSON.stringify([]));
            localStorage.setItem('imageDescriptions', JSON.stringify([]));
        } else {
            localStorage.setItem('imageUrls', JSON.stringify(imageUrls));
            localStorage.setItem('imageDescriptions', JSON.stringify(imageDescriptions));
        }

        // Populate the page with images
        let insertIndex = 0;
        for (const imageUrl of imageUrls) {
            if(imageUrl)
            createPanel(imageUrl, true, insertIndex);
            insertIndex++;
        }

        await saveImage(userID);

        // Set user's attributes in localStorage
        if (!localStorage.getItem('attributes')) {
            localStorage.setItem('attributes', JSON.stringify(data.attributes));
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

function submitEvent(form, description) {
    event.preventDefault();

    document.querySelectorAll(".event-submit").forEach(button => button.disabled = true);
    addPanelBtn.disabled = true;
    deletePanelBtn.disabled = true;

    const progressDisplay = document.createElement('span');
    progressDisplay.classList.add('progress-display', 'hidden');
    form.parentElement.appendChild(progressDisplay);

    const selectedPanel = form.parentElement.querySelector('.generated-image');
    const pencil = form.parentElement.querySelector('.pencil');
    pencil.classList.remove('hidden');

    generatedImage = generateImage(selectedPanel, progressDisplay, description.trim(), JSON.parse(localStorage.getItem('attributes')));
}


async function generateImage(imgElement, progressDisplay, description, attributes) {
    const url = "https://api.novita.ai/v3/async/txt2img";
    let key = "";
    try {
        const response = await fetch('/get-api-key', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        key = await response.json();
        key = key.apiKey

      } catch (error) {
        console.error('Error fetching API key:', error);

        document.querySelectorAll(".event-submit").forEach(button => button.disabled = false);
        addPanelBtn.disabled = false;
        deletePanelBtn.disabled = false;

        return false;
      }

    const data = {
        request: {
            model_name: "protovisionXLHighFidelity3D_beta0520Bakedvae_106612.safetensors",
            prompt: `In a superhero comic book theme showing a ${attributes.gender} ${attributes.height} tall ${attributes.age} years old ${attributes.skinColor}-skinned superhero with ${attributes.hair} and ${attributes.otherFeatures} is doing this action: ${description}.`,
            negative_prompt: "nsfw, superman, crooked fingers, partial body, only showing face, words, weapons",
            width: 512,
            height: 512,
            sampler_name: "DPM++ 2S a Karras",
            guidance_scale: 10.5,
            steps: 20,
            image_num: 1,
            clip_skip: 1,
            seed: -1,
            loras: [],
        }
    };

    const options = {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    try {
        // Request to generate the image
        const response = await fetch(url, options);
        const result = await response.json();
        const task_id = result.task_id;

        // Polling function for task status
        const checkTaskStatus = async () => {
            const imageFetchUrl = `https://api.novita.ai/v3/async/task-result?task_id=${task_id}`;
            const statusResponse = await fetch(imageFetchUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${key}`,
                    "Content-Type": "application/json",
                },
            });
            const statusResult = await statusResponse.json();

            progressDisplay.classList.remove('hidden');
            progressDisplay.innerHTML = `${statusResult.task.progress_percent}%`;

            if (statusResult.task.status === "TASK_STATUS_SUCCEED") {
                const imageUrl = statusResult.images[0].image_url;

                // Send the temporary image URL to the backend to save to S3
                const saveImageResponse = await fetch("/save-image-s3", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ imageUrl }),  // Send the image URL and description
                });

                const saveImageResult = await saveImageResponse.json();
                
                if (saveImageResult.success) {
                    const s3ImageUrl = saveImageResult.s3ImageUrl;  // S3 URL returned by the backend

                    let gridItem = imgElement.parentElement;
                    gridItem.innerHTML = `<img class="generated-image" src=${s3ImageUrl}>`;
                    gridItem.addEventListener('click', (event) => openModal(s3ImageUrl, description, event));

                    // Store the new S3 URL
                    let imageUrls = [];
                    for(const image of document.querySelectorAll('.generated-image')) {
                        if(!image.src.includes("imgs/blank_white.jpeg")){
                            imageUrls.push(image.src);
                        }
                    }

                    let imageDescriptions = JSON.parse(localStorage.getItem('imageDescriptions')) || [];
                    imageDescriptions = imageDescriptions.toSpliced(imageUrls.indexOf(s3ImageUrl), 0, description);
                    localStorage.setItem('imageDescriptions', JSON.stringify(imageDescriptions));

                    saveImage(localStorage.getItem('userID'));
                }else{
                    let gridItem = imgElement.parentElement;
                    gridItem.innerHTML = `<img class="generated-image" src="imgs/blank_white.jpeg">`;
                    return false;
                }

                document.querySelectorAll(".event-submit").forEach(button => button.disabled = false);
                addPanelBtn.disabled = false;
                deletePanelBtn.disabled = false;

            } else if (statusResult.task.status === "TASK_STATUS_QUEUED" || statusResult.task.status === "TASK_STATUS_PROCESSING") {
                setTimeout(checkTaskStatus, 5000); // Retry after 5 seconds
            } else if (statusResult.task.status === "TASK_STATUS_FAILED") {
                let gridItem = imgElement.parentElement;
                gridItem.innerHTML = `<img class="generated-image" src="imgs/blank_white.jpeg">`;
                return false;
            }
        };

        checkTaskStatus();
        return true;
    } catch (error) {
        console.error("Error:", error);

        document.querySelectorAll(".event-submit").forEach(button => button.disabled = false);
        addPanelBtn.disabled = false;
        deletePanelBtn.disabled = false;

        return false;
    }
}


async function saveImage(userID) {
    try {
        let imageUrls = [];
        for(const image of document.querySelectorAll('.generated-image')) {
            if(!image.src.includes("imgs/blank_white.jpeg")){
                imageUrls.push(image.src);
            }
        }

        const response = await fetch('/saveImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: userID,
                updatedImageUrls: imageUrls,
                updatedImageDescriptions: JSON.parse(localStorage.getItem('imageDescriptions'))
            })
        });
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('imageUrls', JSON.stringify(imageUrls));
        } else {
            console.error("Error saving images to DynamoDB:", result.message);
        }
    } catch (error) {
        console.error('Error saving images:', error);
    }
}
