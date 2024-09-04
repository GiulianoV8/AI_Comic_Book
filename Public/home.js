let openModal;
document.addEventListener("DOMContentLoaded", function() {
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
        { element: '#createBtn', content: 'This is your superhero diary. Whether you are going for a run, cooking lunch, or doing homework, you can record it, as everything you do is a daily heroic.' },
        { element: '#addPanelBtn', content: 'Adding an event: This is where you record an event. Click "Add Panel" to add a comic panel. Then click one of the + buttons to select the placement of your event. Once a panel is created, enter a description of your event in the input field and click the pencil button. Let the image load, and you will have superhero you doing that event.' },
        { element: '#deletePanelBtn', content: 'If you don\'t like the image generated or you made a mistake, you can delete the panel. Click the "Delete Panel" button and select unwanted panels. Once selected, you can click "Delete Selected" to delete the selected panels.' },
        { element: '#createBtn-container', content: 'At the end of the day, when you have recorded all of your events, you can view your comic. Click the "Create" button to view your daily heroics! ' }
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
        addPanelBtn.removeEventListener('click', showPlusClickEvent);
        addPanelBtn.style.zIndex = '';
        document.querySelectorAll('.grid-item:not(.create)').forEach(elem => elem.style.zIndex = '');
        deletePanelBtn.style.zIndex = '';
        document.getElementById("deleteConfirmDropdown").style.zIndex = '';
        comicBackground.style.zIndex = '2';
        createBtn.style.zIndex = '';
        document.querySelectorAll('.grid-item:not(.create)').forEach(elem => {
            elem.style.zIndex = '';
            elem.querySelector('img').style.pointerEvents = 'auto';
        });
        document.querySelectorAll('.plus-button').forEach((element) => {
            element.style.zIndex = '';
            element.removeEventListener('click', showPanelsEvent);
        });
        nextStepButton.innerText = "Next";
    }
    function showPanelsEvent() {
        document.querySelectorAll('.grid-item:not(.create)').forEach(elem => {
            elem.style.zIndex = '1000'
            elem.querySelector('img').style.pointerEvents = 'none'; 
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

    // function updateTutorial(index) {
    //     tutorialImage.src = tutorialImages[index];
    //     tutorialCaption.innerHTML = tutorialCaptions[index]
    // }
    // tutorialBtn.addEventListener("click", () => {
    //     tutorialImageIndex = 0;
    //     tutorialModal.style.display = "flex";
    //     updateTutorial(tutorialImageIndex);
    // });
    // leftTutorial.onclick = () => {
    //     if(tutorialImageIndex > 0){
    //         tutorialImageIndex--;
    //         updateTutorial(tutorialImageIndex);
    //     }
    // }
    // rightTutorial.onclick = () => {
    //     if(tutorialImageIndex < 3){
    //         tutorialImageIndex++;
    //         updateTutorial(tutorialImageIndex);
    //     }
    // }
    
    // closeTutorialBtn.onclick = function () {
    //     tutorialModal.style.display = "none";
    // }
    document.getElementById("createBtn").addEventListener("click", showComicPanels);
    document.querySelector(".close-overlay").addEventListener("click", closeComicPanels);

    function showComicPanels() {
        const comicBackground = document.getElementById("comic-background");
        const comicGrid = document.querySelector(".comic-grid");
        const comicDisplayTitle = document.getElementById("comic-display-title");
        
        comicDisplayTitle.innerText = document.getElementById("comic-title").innerText;

        JSON.parse(localStorage.getItem('imageUrls')).forEach(url => {
            const panel = document.createElement("div");
            panel.classList.add("comic-panel");
            panel.innerHTML = `<img src="${url}" alt="Comic Panel" class="panel-image">`;
            comicGrid.appendChild(panel);
        });

        comicBackground.classList.remove("hidden");
    }

    function closeComicPanels() {
        const comicGrid = document.querySelector(".comic-grid");

        document.getElementById("comic-background").classList.add("hidden");
        
        let currentPanels = document.getElementsByClassName('comic-panel');
        if(currentPanels.length > 0) {
            document.querySelectorAll('.comic-panel').forEach(item => {
                comicGrid.removeChild(item);
            }); // Clear existing panels
        }
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
    }

    // Function to close modal
    closeBtn.onclick = function () {
        modal.style.display = "none";
    }
    
    // Function to open modal
    openModal = (imageUrl, description, event) => {
        if(!event.target.classList.contains("circle")){
            modal.style.display = "block";
            modalImg.src = imageUrl;
            captionText.innerHTML = description;
        }
    }

    // Toggle add panel mode on "Add Panel" button click
    addPanelBtn.addEventListener("click", addPanelClickEvent);

    function addPanelClickEvent(){
        addPanelMode = !addPanelMode;
        if (addPanelMode) {
            showPlusButtons();
            addPanelBtn.innerText = "Exit Add Panel Mode";  // Change button text
        } else {
            hidePlusButtons();
            addPanelBtn.innerText = "Add Panel";  // Revert button text
        }
    }

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

    // Delete selected panels on "Delete Panel" button click
    deletePanelBtn.addEventListener("click", function() {
        deleteConfirmDropdown.classList.toggle('hidden');
        if (!deleteMode) {
            deleteMode = true;
            document.querySelectorAll(".grid-item").forEach(item => {
                if (!item.classList.contains("create")) {
                    let circle = document.createElement("div");
                    circle.classList.add("circle");
                    circle.style.display = "block";
                    circle.addEventListener("click", function() {
                        if (deleteMode && circle.classList.contains("circle")) {
                            circle.classList.toggle("selected");
                            circle.parentElement.classList.toggle("highlight");
                            if (circle.classList.contains("selected")) {
                                selectedItems.push(circle.parentElement);
                            } else {
                                selectedItems = selectedItems.filter(item => item !== circle.parentElement);
                            }
                        }
                    });
                    item.appendChild(circle);
                }
            });
        } else {
            document.querySelectorAll(".grid-item .circle").forEach(circle => circle.remove());
            document.querySelectorAll(".grid-item").forEach(item => item.classList.remove("highlight"));
            deleteMode = false;
            selectedItems = [];
        }
    });

    // Confirm deletion of selected panels
    deleteConfirmBtn.addEventListener("click", async function() {
        deleteConfirmDropdown.classList.add('hidden');
        for (let item of selectedItems) { 
            item.remove();
        }
        localStorage.setItem("imageDescriptions", JSON.stringify([]));
        await saveImage(localStorage.getItem('userID'));
        document.querySelectorAll(".grid-item .circle").forEach(circle => circle.remove());
        document.querySelectorAll(".highlight").forEach(highlight => highlight.classList.remove("highlight"));
        // Reset delete mode
        deleteMode = false;
        selectedItems = [];
    });

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
        await saveImage(localStorage.getItem('userID'));
    });

    // Prevent default form submission
    let forms = document.querySelectorAll(".input-container");
    forms.forEach(item => item.addEventListener("submit", e => e.preventDefault()));
});

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
                <input class="event-input" type="text" name="description" placeholder="Event">
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
        // Get images from the datatable's image urls list attribute
        let imageUrls;
        if(localStorage.getItem('imageUrls') && localStorage.getItem('imageUrls') !== 'undefined' && localStorage.getItem('imageUrls') !== undefined) {
            imageUrls = JSON.parse(localStorage.getItem('imageUrls'));
        }else{
            imageUrls = data.imageUrls;
        }

        let imageDescriptions;
        if(localStorage.getItem('imageDescriptions') && localStorage.getItem('imageDescriptions') !== 'undefined' && localStorage.getItem('imageDescriptions') !== undefined) {
            imageDescriptions = JSON.parse(localStorage.getItem('imageDescriptions'));
        }else{
            imageDescriptions = data.imageDescriptions;
        }
        
        let resetImages = userData.firstLogin;
        if(resetImages == true){
            localStorage.setItem('imageUrls', JSON.stringify([]));
            localStorage.setItem('imageDescriptions', JSON.stringify([]));
            imageUrls = [];
            imageDescriptions = [];
        }else{
            localStorage.setItem('imageUrls', JSON.stringify(imageUrls));
            localStorage.setItem('imageDescriptions', JSON.stringify(imageDescriptions));
        }

        let insertIndex = 0;
        for(const imageUrl of imageUrls) {
            createPanel(imageUrl, true, insertIndex);
            insertIndex++;
        }
        await saveImage(data.userID);
        // Set user's attributes
        if(!localStorage.getItem('attributes')){
            localStorage.setItem('attributes', JSON.stringify(data.attributes));
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

function submitEvent(form, description){
    event.preventDefault()

    const progressDisplay = document.createElement('span');
    progressDisplay.classList.add('progress-display', 'hidden');
    form.parentElement.appendChild(progressDisplay);
    
    const selectedPanel = form.parentElement.querySelector('.generated-image');
    
    const pencil = form.parentElement.querySelector('.pencil');
    pencil.classList.remove('hidden');

    let stringedAttributes = "";
    for (const attribute of JSON.parse(localStorage.getItem('attributes'))) {
        stringedAttributes += `${attribute},\n`;
    }
    generateImage(selectedPanel, progressDisplay, description.trim(), stringedAttributes);
}

async function generateImage(imgElement, progressDisplay, description, attributes) {
    const url = "https://api.novita.ai/v3/async/txt2img";
    const key = "df06b948-2b6d-465f-b997-c6cb900bd551";

    const data = {
        extra: {
            custom_storage: {
                aws_s3: {
                  region: "us-east-1",
                  bucket: "comicbookimages",
                  path: "/"
                }
              }
        },
        request: {
            model_name: "protovisionXLHighFidelity3D_beta0520Bakedvae_106612.safetensors",
            prompt: `In a superhero comic book theme showing a whole hero with the following attributes:{${attributes} and casual clothing\n} is doing this: ${description} ${description} ${description} ${description} ${description}`,
            negative_prompt: "nsfw, superman, crooked fingers, partial body, only showing face",
            width: 512,
            height: 512,
            sampler_name: "DPM++ 2S a Karras",
            guidance_scale: 10.5,
            steps: 20,
            image_num: 1,
            clip_skip: 1,
            seed: -1,
            loras: [],
        },
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

        // Function to poll the task status
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
                // Image successfully received
                const imageUrl = statusResult.images[0].image_url;
                imgElement.src = imageUrl;

                let imageUrls = JSON.parse(localStorage.getItem('imageUrls'));
                imageUrls.push(imageUrl);
                localStorage.setItem('imageUrls', JSON.stringify(imageUrls));

                let imageDescriptions = JSON.parse(localStorage.getItem('imageDescriptions')) || [];

                imageDescriptions = imageDescriptions.toSpliced(imageUrls.indexOf(imageUrl), 0, description);
                localStorage.setItem('imageDescriptions', JSON.stringify(imageDescriptions));
                
                saveImage(localStorage.getItem('userID'));

                let gridItem = imgElement.parentElement;
                gridItem.innerHTML = `<img class="generated-image" src=${imageUrl}>`
                gridItem.addEventListener('click', (event) => openModal(imageUrl, description, event));

            } else if (statusResult.task.status === "TASK_STATUS_QUEUED" || statusResult.task.status === "TASK_STATUS_PROCESSING") {
                // Still processing, retry after some time
                setTimeout(checkTaskStatus, 5000); // Retry after 5 seconds
            } else if (statusResult.task.status === "TASK_STATUS_FAILED") {
                // Task failed
                let gridItem = imgElement.parentElement;
                gridItem.innerHTML = `<img class="generated-image" src="imgs/blank_white.jpeg">`
            }
        };

        // Start polling the task status
        checkTaskStatus();
    } catch (error) {
        console.error("Error:", error);
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
