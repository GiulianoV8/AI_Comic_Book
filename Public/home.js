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
        { element: '#addPanelBtn', content: 'Adding an event: This is where you record an event. Click "Add Panel" to add a comic panel. Then click one of the + buttons to select the placement of your event. Once a panel is created, enter a description of your event (I cooked breakfast, ran in the park, etc.) in the input field and click the pencil button. Alternatively, you can press the microphone button (or use built in speech-to-text if your device has) and speak into your device to record your event Let the image load, and you will have superhero you doing that event.' },
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
        document.querySelectorAll('.grid-item').forEach(elem => elem.style.zIndex = '');

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
                <textarea class="event-input" name="description" placeholder="Event" rows="1"></textarea>
                <button class="mic-button" type="button">
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
            document.getElementsByClassName(`event-input`)[position].value += ` ${transcript}`;
        };
        recognition.onstart = () => {
            recognizingSpeech = true;
            document.getElementByClassName(`event-input`)[position].placeholder = "Listening...";
            document.getElementByClassName(`mic-button`)[position].style.backgroundColor = "#00a6cb";

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

async function fillData(userID) {
    try {
        // Clear current data
        localStorage.clear();
        localStorage.setItem('userID', userID);

        // Fetch user data from the backend
        const response = await fetch(`/getUserData?userID=${userID}`);
        const userData = await response.json();
        const data = userData.item;

        localStorage.setItem('username', data.username);

        // Fill in the #comic-title input tag with the comicTitle attribute value
        const comicTitle = document.getElementById('comic-title');
        if (comicTitle && data.comicTitle) {
            comicTitle.innerText = data.comicTitle;
            localStorage.setItem('comicTitle', data.comicTitle);
        }

        // Handle image objects
        const imageObjects = data.imageObjects || [];
        localStorage.setItem('imageObjects', JSON.stringify(imageObjects));

        // Sort images by their order property
        const sortedImages = imageObjects.sort((a, b) => a.order - b.order);

        // Render images on the page
        const gridContainer = document.getElementById('gridContainer');
        sortedImages.forEach((imageObject) => {
            const imageContainer = document.createElement('div');
            imageContainer.classList.add('image-container'); // Add your container class
            imageContainer.innerHTML = `
                <img src="${imageObject.image}" alt="${imageObject.description}">
                <p>${imageObject.description}</p>
            `;
            gridContainer.appendChild(imageContainer);
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

function submitEvent(form, description) {
    event.preventDefault();

    document.querySelectorAll(".event-submit").forEach(button => button.disabled = true);
    addPanelBtn.disabled = true;
    deletePanelBtn.disabled = true;

    const selectedPanel = form.parentElement.querySelector('.generated-image');
    const pencil = form.parentElement.querySelector('.pencil');
    pencil.classList.remove('hidden');

    generateImage(selectedPanel, description.trim(), JSON.parse(localStorage.getItem('attributes')));
}


async function generateImage(imgElement, description, attributes) {
    const prompt = `A high-energy comic book panel of a ${attributes.age} ${attributes.gender} superhero ${description}, 
    drawn in a bold ink style with thick outlines, Ben-Day dots, and exaggerated perspective. 
    Color palette: Vibrant primaries (red/blue/yellow) with comic-book halftone shading. 
    Style: Cross between [Jack Kirby's dynamic poses] and [Bruce Timm's clean lines]. 
    Add speed lines, sound effects, and a dramatic spotlight.`;
    
    const position = Array.from(document.querySelectorAll(".generated-image")).indexOf(imgElement);

    const formData = new FormData();
	formData.append("username", localStorage.getItem('username'));
    formData.append("userID", localStorage.getItem('userID'));
    formData.append("prompt", prompt);
    formData.append("isAvatar", false);
	formData.append("description", description);
    try {
        // Generate photo through /generatePhoto endpoint
        const response = await fetch("/generatePhoto", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                username: localStorage.getItem('userID'), 
                prompt: prompt, 
                isAvatar: false, 
                position: position
            }),
        });

        const result = await response.json();
        if (!result.success) {
            console.error("Error generating image:", result.message);
            return false;
        }

        
        saveImage(localStorage.getItem("userID"), result.imageObjects);

        // Update the UI
        imgElement.src = result.image;
    } catch (error) {
        console.error("Error generating image:", error);
        imgElement.src = "imgs/blank_white.jpeg"; // Fallback image
        return false;
    }

    document.querySelectorAll(".event-submit").forEach((button) => (button.disabled = false));
    addPanelBtn.disabled = false;
    deletePanelBtn.disabled = false;
}

async function saveImage(userID, imageObjects) {
    localStorage.setItem("imageObjects", JSON.stringify(imageObjects));
}

