let openModal;
let modalDisabled = false;
function updatePanelCount() {
    let panelCount = Array.from(document.querySelectorAll(".grid-item")).length;
    addPanelBtn.innerHTML = `Add Panel ${panelCount}/12`;
    if (panelCount >= 12) {
        addPanelBtn.disabled = true;
        addPanelBtn.style.pointerEvents = "none";
    } else {
        addPanelBtn.disabled = false;
        addPanelBtn.style.pointerEvents = "auto";
    }
}
document.addEventListener("DOMContentLoaded", function() {
    function testCreateImageObjects() {
        const imageObjects = [];
        const username = localStorage.getItem('username') || 'GiulianoV';
        const baseDate = Date.now();
        // Fetch the image as a buffer (ArrayBuffer)
        for (let i = 0; i < 12; i++) {
            imageObjects.push({
                image: `https://upload.wikimedia.org/wikipedia/commons/6/63/Icon_Bird_512x512.png`,
                description: `Test image ${i + 1}`,
                order: i,
                key: `users/${username}/image_${baseDate + i * 24 * 60 * 60 * 1000}.jpeg`
            });
        }
        localStorage.setItem('imageObjects', JSON.stringify(imageObjects));
        saveImage(localStorage.getItem('userID'), imageObjects, true);
        return imageObjects;
    }
    // document.getElementById("testTenBtn").addEventListener("click", testCreateImageObjects);
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
    

    const rewriteBtn = document.getElementById("rewriteBtn");
    const rewriteConfirmBtn = document.getElementById("rewriteConfirmBtn");
    const dropdown = document.getElementById('rewriteDropdown');
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

    const imageModal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("imageCaption");
    const closeModalBtn = document.getElementById("closeModalBtn");
    
    const tutorialOverlay = document.getElementById("tutorial-overlay");
    const tutorialBtn = document.getElementById("questionBtn");
    const closeTutorialBtn = document.getElementById("close-tutorial-btn");
    const createBtn = document.getElementById("createBtn");

    // const steps = [
    //     { element: '#createBtn', content: 'This is your superhero diary. Whether you are going for a run, cooking lunch, or doing homework, you can record it, because everything you do is a daily heroic.' },
    //     { element: '#addPanelBtn', content: 'Adding an event: This is where you record an event. Click "Add Panel" to add a comic panel. Then click one of the + buttons to select the placement of your event. Once a panel is created, enter a description of your event (I cooked breakfast, ran in the park, etc.) in the input field and click the pencil button. Alternatively, you can press the microphone button (or use built in speech-to-text if your device has) and speak into your device to record your event Let the image load, and you will have superhero you doing that event.' },
    //     { element: '#deletePanelBtn', content: 'Deleting an event: AI is not perfect, and will therefore not produce a perfect image every time. So, if you don\'t like the image generated or you made a mistake, you can delete the panel. Click the "Delete Panel" button and select unwanted panels. Once selected, you can click "Delete Selected" to delete the selected panels.' },
    //     { element: '#createBtn-container', content: 'Viewing your comic: At the end of the day, when you have recorded all of your events, you can view your comic. Click the "Create" button to view your daily heroics! ' }
    // ];

    // let currentStep = 0;
    
    // const tutorialPopup = document.getElementById('tutorialPopup');
    // const tutorialContent = document.getElementById('tutorialContent');
    // const tutorialOverlay = document.getElementById('tutorialOverlay');
    // const nextStepButton = document.getElementById('nextStep');
    // const prevStepButton = document.getElementById('prevStep');
    // const skipButton = document.getElementById('skipTutorial');
    // const comicBackground = document.getElementById('comic-background');

    // hideTutorial();
    // function resetTutorials() {
    //     if(addPanelBtn.innerHTML == "Cancel") {
    //         addPanelBtn.click();
    //     }
    //     if(deletePanelBtn.innerHTML == "Cancel") {
    //         deletePanelBtn.click();
    //     }
    //     updatePanelCount();
    //     addPanelBtn.removeEventListener('click', showPlusClickEvent);
    //     addPanelBtn.style.zIndex = '';
    //     document.querySelectorAll('.grid-item').forEach(elem => elem.style.zIndex = '');
    //     deletePanelBtn.style.zIndex = '';
    //     document.getElementById("deleteConfirmDropdown").style.zIndex = '';
    //     comicBackground.style.zIndex = '2';
    //     createBtn.style.zIndex = '1';
    //     document.querySelectorAll(".circle").forEach(elem => elem.style.zIndex = '3');
    //     document.querySelectorAll('.grid-item').forEach(elem => {
    //         elem.style.zIndex = '';
    //         modalDisabled = false;
    //     });
    //     document.querySelectorAll('.plus-button').forEach((element) => {
    //         element.style.zIndex = '';
    //         element.removeEventListener('click', showPanelsEvent);
    //     });
    //     nextStepButton.innerText = "Next";
    // }
    // function showPanelsEvent() {
    //     document.querySelectorAll('.grid-item').forEach(elem => {
    //         elem.style.zIndex = '1000';
    //         modalDisabled = true;
    //     });
    // }
    // function showPlusClickEvent() {
    //     document.querySelectorAll('.plus-button').forEach((element) => {
    //         element.style.zIndex = '1000';
    //         element.addEventListener('click', showPanelsEvent);
    //     });
    // }
    // function showStep(stepIndex) {
    //     const step = steps[stepIndex];
    //     const targetElement = document.querySelector(step.element);
        
    //     tutorialContent.textContent = step.content;
    //     tutorialPopup.style.display = 'block';
    //     tutorialOverlay.style.display = 'block';

    //     switch(stepIndex) {
    //         case 0: // intro
    //             resetTutorials();
    //             break;
    //         case 1: // add panel
    //             resetTutorials();
    //             showPanelsEvent();
    //             showPlusClickEvent();
    //             targetElement.onclick = showPlusClickEvent;
    //             break;
    //         case 2: // delete panel
    //             resetTutorials();
    //             showPanelsEvent();
    //             document.getElementById("deleteConfirmDropdown").style.zIndex = '1000';
    //             break;
    //         case 3: // create buttom
    //             resetTutorials();
    //             targetElement.style.zIndex = '1000';
    //             comicBackground.style.zIndex = '1001';
    //             break;
    //     }
    //     targetElement.style.zIndex = '1000';
        
    //     // Enable or disable navigation buttons
    //     prevStepButton.disabled = stepIndex === 0;
    //     if(stepIndex === steps.length - 1) {
    //         nextStepButton.innerText = "Let's Go!";
    //     }
    // }

    // function hideTutorial() {
    //     resetTutorials();
    //     tutorialPopup.style.display = 'none';
    //     tutorialOverlay.style.display = 'none';
    //     currentStep = 0;
    //     nextStepButton.innerText = 'Next';
    // }

    // nextStepButton.addEventListener('click', () => {
    //     if(nextStepButton.innerText === "Let's Go!") {
    //         hideTutorial();
    //     } else {
    //         currentStep++;
    //         showStep(currentStep);
    //     }
    // });

    // prevStepButton.addEventListener('click', () => {
    //     currentStep--;
    //     showStep(currentStep);
    // });

    // skipButton.addEventListener('click', hideTutorial);

    tutorialBtn.addEventListener('click', () => {
        tutorialOverlay.style.display = "block";
        tabBtns[0].click(); // start with first tab active
    });

    // Tutorial Overlay Tab Logic
    const tabBtns = tutorialOverlay.querySelectorAll('.tutorial-tab');
    const videos = tutorialOverlay.querySelectorAll('.tutorial-video');
    const tutorialCaptions = tutorialOverlay.querySelectorAll('.tutorial-caption');
    videos.forEach(video => {
        video.muted = true;
        video.volume = 0;
        video.addEventListener('volumechange', () => {
            video.muted = true;
            video.volume = 0;
        });
    });
    tabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            videos.forEach((vid, vIdx) => {
                if (vIdx === idx) {
                    tutorialCaptions[vIdx].style.display = 'block';
                    vid.style.display = 'block';
                    vid.currentTime = 0;
                } else {
                    tutorialCaptions[vIdx].style.display = 'none';
                    vid.pause();
                    vid.style.display = 'none';
                }
            });
        });
    });

        // Function to close tutorial modal
    closeTutorialBtn.addEventListener("click", () => {
        document.getElementById("tutorial-overlay").style.display = "none";
        videos.forEach(vid => vid.pause());
        tutorialOverlay.style.display = 'none';
    });
    
    if(!isLocalStorageEnabled) {
        document.getElementById("noLocalStorageBackground").classList.add('hidden');
        console.log('storage not enabled');
    }

    if(!localStorage.getItem('userID')){
        window.location.replace("/login.html");
    }else {
        userID = localStorage.getItem("userID");
        fillData(userID);    
    }
    
    createBtn.addEventListener("click", showComicPanels);
    document.querySelector(".close-overlay").addEventListener("click", closeComicPanels);

    function generateComicLayout(n) {
        const layouts = [
            // 1 image
            [
                ["panel0"]
            ],
            // 2 images
            [
                ["panel0", "panel1"]
            ],
            // 3 images
            [
                ["panel0", "panel1"],
                ["panel2", "panel2"]
            ],
            // 4 images
            [
                ["panel0", "panel1"],
                ["panel2", "panel3"]
            ],
            // 5 images
            [
                ["panel0", "panel2"],
                ["panel1", "panel2"],
                ["panel3", "panel4"]
            ],
            // 6 images
            [
                ["panel0", "panel1", "panel2"],
                ["panel3", "panel4", "panel5"]
            ],
            // 7 images
            [
                ["panel0", "panel1", "panel2"],
                ["panel3", "panel4", "panel4"],
                ["panel6", "panel6", "panel5"]
            ],
            // 8 images
            [
                ["panel0", "panel0", "panel1"],
                ["panel0", "panel0", "panel2"],
                ["panel3", "panel3", "panel4"],
                ["panel5", "panel6", "panel7"]
            ],
            // 9 images
            [
                ["panel0", "panel1", "panel2"],
                ["panel3", "panel4", "panel4"],
                ["panel5", "panel4", "panel4"],
                ["panel6", "panel6", "panel7"],
                ["panel6", "panel6", "panel8"]
            ],
            // 10 images
            [
                ["panel0", "panel1", "panel2"],
                ["panel3", "panel4", "panel4"],
                ["panel5", "panel5", "panel6"],
                ["panel7", "panel8", "panel9"]
            ],
            // 11 images
            [
                ["panel0", "panel1", "panel1"],
                ["panel2", "panel2", "panel3"],
                ["panel4", "panel5", "panel5"],
                ["panel6", "panel7", "panel7"],
                ["panel8", "panel9", "panel10"]

            ],
            // 12 images
            [
                ["panel0", "panel0", "panel1"],
                ["panel2", "panel3", "panel4"],
                ["panel5", "panel6", "panel6"],
                ["panel7", "panel8", "panel9"],
                ["panel10", "panel1", "panel11"],
            ]
        ];
    
        // Clamp n to [1, 12]
        n = Math.max(1, Math.min(12, n));
        const layout = layouts[n - 1];
    
        // Build grid-template-areas string
        const gridAreas = layout.map(row =>
            '"' + row.map(cell => cell === "." ? "." : cell).join(" ") + '"'
        ).join("\n    ");
    
        // Build panels array with position and size for each panel
        const panelMap = {};
        layout.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                if (cell !== ".") {
                    if (!panelMap[cell]) {
                        panelMap[cell] = { name: cell, index: parseInt(cell.replace("panel", "")), row: rIdx, col: cIdx, w: 1, h: 1 };
                    } else {
                        // Expand width or height if panel spans multiple cells
                        if (panelMap[cell].row === rIdx) panelMap[cell].w++;
                        if (panelMap[cell].col === cIdx) panelMap[cell].h++;
                    }
                }
            });
        });
        // Sort panels by their index to match imageObjects order
        const panels = Object.values(panelMap).sort((a, b) => a.index - b.index);
    
        return { gridAreas, panels };
    }

    function showComicPanels() {
        // Cancel add/delete panel modes if active
        if(addPanelBtn.innerHTML == "Cancel") addPanelBtn.click();
        if(deletePanelBtn.innerHTML == "Cancel") deletePanelBtn.click();
        document.querySelectorAll('.grid-item').forEach(elem => elem.style.zIndex = '');

        // Get relevant DOM elements
        const comicBackground = document.getElementById("comic-background");
        const comicGrid = document.querySelector(".comic-grid");
        const comicDisplayTitle = document.getElementById("comic-display-title");

        // Set comic title
        comicDisplayTitle.innerText = document.getElementById("comic-title").innerText;

        // Get images and descriptions from localStorage
        const imageObjects = JSON.parse(localStorage.getItem('imageObjects')) || [];

        // Clear previous comic grid
        comicGrid.innerHTML = "";

        console.log("Generating comic layout with", imageObjects);

        // Generate layout using your function
        const { gridAreas, panels } = generateComicLayout(imageObjects.length);

        // Set up the CSS grid using the generated layout
        comicGrid.style.gridTemplateAreas = gridAreas;

        // Create and place each panel in the grid
        panels.forEach((panel, i) => {
            console.log(panel, i, panel.index, imageObjects[panel.index]);
            if (!imageObjects[panel.index]) return;
            const imageUrl = imageObjects[panel.index].image;
            const captionText = imageObjects[panel.index].description;

            const panelDiv = document.createElement('div');
            panelDiv.classList.add('comic-panel');
            panelDiv.style.gridArea = panel.name;

            const image = document.createElement('img');
            image.src = imageUrl;
            image.alt = "Comic Image";
            image.classList.add('panel-image');

            panelDiv.appendChild(image);
            comicGrid.appendChild(panelDiv);

            panelDiv.addEventListener('click', event => {openModal(imageUrl, captionText, event);});
        });
        
        const comicPanels = Array.from(comicGrid.children);
        const columns = getComputedStyle(comicGrid).gridTemplateColumns.split(' ').length;

        comicPanels.forEach(panel => {
            const gridRow = parseInt(getComputedStyle(panel).gridRowStart, 10);
            if (gridRow % 2 === 1) {
                panel.style.transform = 'skewX(-5deg)';
            } else {
                panel.style.transform = 'skewX(5deg)';
            }
        });
        // Show the comic overlay
        comicBackground.classList.remove("hidden");

    }
    
    // function createComicPanel(imageUrl, captionText) {
    //     const panel = document.createElement('div');
    //     panel.classList.add('comic-panel');
    
    //     const content = document.createElement('div');
    //     content.classList.add('panel-content');
    
    //     // Randomly decide whether to put caption above or below
    //     const isCaptionOnTop = Math.random() < 0.5; // 50% chance
    
    //     const caption = document.createElement('div');
    //     caption.classList.add('panel-caption', isCaptionOnTop ? 'top' : 'bottom'); // Add top or bottom class
    //     caption.textContent = !captionText ? '' : captionText;
    
    //     const image = document.createElement('img');
    //     image.src = imageUrl;
    //     image.alt = "Comic Image";
    //     image.classList.add('panel-image');
    
    //     // Append elements based on caption position
    //     if (isCaptionOnTop) {
    //         content.appendChild(caption); // Add caption first
    //         content.appendChild(image); // Add image second
    //     } else {
    //         content.appendChild(image); // Add image first
    //         content.appendChild(caption); // Add caption second
    //     }
    
    //     panel.appendChild(content);
    //     return panel;
    // }

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

        const gridItems = document.querySelectorAll(".grid-item");
        plusButtons.forEach(button => button.remove());  // Clear existing buttons

        if (gridItems.length == 0) {
            const plusBtn = createPlusButton(0);
            gridContainer.appendChild(plusBtn);
            plusButtons.push(plusBtn);
        }
        // Track where we've already added a plus button
        for (let i = 0; i <= gridItems.length; i++) {
            const prevIsImage = i > 0 && !gridItems[i - 1]?.querySelector(".event-input");
            const nextIsImage = i < gridItems.length && !gridItems[i]?.querySelector(".event-input");

            // Add plus button at position i if:
            // - The item to the left is an image and the item to the right is an image (or edge)
            // - But NOT if either side is a form
            if (
                (i === 0 && nextIsImage) ||
                (i === gridItems.length && prevIsImage) ||
                (prevIsImage && nextIsImage)
            ) {
                const plusBtn = createPlusButton(i);
                if (gridItems[i]) {
                    gridContainer.insertBefore(plusBtn, gridItems[i]);
                } else {
                    gridContainer.appendChild(plusBtn);
                }
                plusButtons.push(plusBtn);
            }
        }
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
        document.querySelectorAll(".plus-button").forEach(btn => btn.remove());
        plusButtons = [];
        addPanelMode = false;
        deletePanelBtn.style.pointerEvents = "auto";
        updatePanelCount();  // Update panel count
    }

    // Function to close modal
    closeModalBtn.onclick = function () {
        imageModal.style.display = "none";
    }
    
    // Function to open modal
    openModal = (imageUrl, description, event) => {
        if(!modalDisabled){
            if(!event.target.classList.contains("circle")){
                if(addPanelBtn.innerHTML == "Cancel") {
                    addPanelBtn.click();
                }
                if(deletePanelBtn.innerHTML == "Cancel") {
                    deletePanelBtn.click();
                }
                imageModal.style.display = "block";
                modalImg.src = imageUrl;
                captionText.innerHTML = description ? description : "";
            }
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

    // Toggle add panel mode on "Add Panel" button click
    addPanelBtn.addEventListener("click", function() {
        addPanelMode = !addPanelMode;
        if (addPanelMode) {
            deletePanelBtn.style.pointerEvents = "none";
            showPlusButtons();
            addPanelBtn.innerText = "Cancel";  // Change button text
        } else {
            deletePanelBtn.style.pointerEvents = "auto";
            hidePlusButtons();
            updatePanelCount();  // Revert button text
        }
    });

    // Toggle delete panel mode
    deletePanelBtn.addEventListener("click", function() {
        deleteConfirmBtn.disabled = true;
        deleteMode = !deleteMode;
        deleteConfirmDropdown.classList.toggle('hidden');
        addPanelBtn.style.pointerEvents = deleteMode ? 'none' : 'auto';
        deletePanelBtn.innerText = deleteMode ? 'Cancel' : 'Delete Panel';

        let imageObjects = JSON.parse(localStorage.getItem('imageObjects')) || [];
        if (deleteMode) {
            document.querySelectorAll(".grid-item").forEach((item, index) => {
                if (!item.querySelector(".circle")) {
                    let circle = document.createElement("div");
                    circle.classList.add("circle");
                    circle.style.display = "block"; // Make sure circle is visible
                    item.appendChild(circle);
                    circle.addEventListener("click", function(event) {
                        event.stopPropagation(); // Prevent click from bubbling up to grid-item
                        circle.classList.toggle("selected");
                        item.classList.toggle("highlight");
                        let realIndex = -1;
                        if (circle.classList.contains("selected")) {
                            if (item.querySelector(".event-input")) {
                                realIndex = index;
                                selectedItems.push({eventInput: true, gridItem: item, index: index})
                            } else {
                                // if selected, add index to selectedItems
                                let imageObjectIndex = imageObjects.findIndex(obj => obj.image == item.querySelector(".generated-image").src);
                                selectedItems.push({gridItem: item, index: imageObjectIndex});
                                realIndex = imageObjectIndex;
                            }
                        } else {
                            // if deselected, remove index from selectedItems
                            selectedItems.splice(realIndex, 1);
                        }

                        deleteConfirmBtn.disabled = selectedItems.length == 0;
                    });
                    
                }
            });
        } else {
            hideDeletePanels();
        }
    });

    // Confirm deletion of selected panels
    deleteConfirmBtn.addEventListener("click", async function() {
        deleteConfirmDropdown.classList.add('hidden');
        let imageObjects = JSON.parse(localStorage.getItem('imageObjects')) || [];
        for (let imageObject of selectedItems) {
            const gridItem = imageObject.gridItem;
            if (gridItem) {
                gridItem.remove();
            }
            if (!imageObject.eventInput) {
                imageObjects.splice(imageObject.index, 1);
            }
        }

        if (selectedItems.length !== 0) {
            await saveImage(localStorage.getItem('userID'), imageObjects, true);
        }

        selectedItems = [];
        
        hideDeletePanels();
        deletePanelBtn.innerText = 'Delete Panel';
        addPanelBtn.style.pointerEvents = 'auto';
        deleteMode = false;

        updatePanelCount();
    });

    // Hide and reset delete panels
    function hideDeletePanels() {
        document.querySelectorAll(".grid-item .circle").forEach(circle => circle.remove());
        document.querySelectorAll(".grid-item").forEach(item => item.classList.remove("highlight"));
        selectedItems = [];
    }

    // Delete all panels except on "Rewrite" button click
    rewriteBtn.addEventListener("click", function() {
        dropdown.classList.toggle('hidden');
    });

    rewriteConfirmBtn.addEventListener("click", async function() {
        dropdown.classList.add('hidden');
        // remove all grid-item children of gridContainer
        const gridContainer = document.getElementById("gridContainer");
        while (gridContainer.firstChild) {
            gridContainer.removeChild(gridContainer.firstChild);
        }
        // Clear localStorage and reset imageObjects
        await saveImage(localStorage.getItem('userID'), [], true);
        updatePanelCount();
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
        const description = JSON.parse(localStorage.getItem('imageObjects'))[position].description;
        newGridItem.addEventListener('click', event => openModal(imageUrl, description, event));
    } else {
        newGridItem.innerHTML = `
            <div class="loading-container hidden">
                <span class="loader loading"></span>
            </div>
            <img class="generated-image" src=${src}>
            <form class="input-container" onSubmit="submitEvent(this, description.value)">
                <textarea class="event-input" id="event-input" name="description" placeholder="Event" rows="1"></textarea>
                <div class="event-input-btns">
                    <button class="mic-button" type="button">
                        <img src="imgs/mic_icon.png" alt="speak" class="mic-icon">
                    </button>
                    <button class="event-submit" type="submit">
                        <img src="imgs/pencil_icon.jpeg" alt="Submit" class="submit-image">
                    </button>
                </div>
            </form>
        `;
    }

    const gridItems = document.querySelectorAll(".grid-item");
    if (position < gridItems.length - 1) {
        gridContainer.insertBefore(newGridItem, gridItems[position]);
    } else {
        gridContainer.appendChild(newGridItem);
    }

    if (!image) {
        const eventInput = newGridItem.querySelector(".event-input");
        const micButton = newGridItem.querySelector(".mic-button");
        const LANG = "en-US";
        const recognition = new (window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.msSpeechRecognition)();
        recognition.lang = LANG;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            eventInput.value += ` ${transcript}`;
        };
        recognition.onstart = () => {
            recognizingSpeech = true;
            eventInput.placeholder = "Listening...";
            micButton.style.backgroundColor = "#00a6cb";

            // Disable all other mic buttons
            disableOtherMicButtons(position, true);
        };
        recognition.onend = () => {
            recognizingSpeech = false;
            eventInput.placeholder = "Event";
            micButton.style.backgroundColor = "#e8e8e8"; // Reset background color

            // Re-enable all mic buttons
            disableOtherMicButtons(position, false);
        };

        // Toggle between starting and stopping recognition
        micButton.addEventListener("click", () => {
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
        localStorage.setItem('attributes', JSON.stringify(data.attributes));

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
        sortedImages.forEach((imageObject) => {
            createPanel(imageObject.image, true, imageObject.order);
        });

        updatePanelCount();
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

function submitEvent(form, description) {
    event.preventDefault();
    if (description.trim().length <= 1) {
        return;
    }
    document.querySelectorAll(".event-submit").forEach(button => button.disabled = true);
    addPanelBtn.disabled = true;
    deletePanelBtn.disabled = true;

    const gridItem = form.parentElement;

    generateImage(gridItem, description.trim(), JSON.parse(localStorage.getItem('attributes')));
}


async function generateImage(gridItem, description, attributes) {
    const prompt = `A high-energy comic book panel of a ${attributes.age} ${attributes.gender} superhero ${description}, 
    drawn in a bold ink style with thick outlines and exaggerated perspective. 
    Color palette: Vibrant primaries (red/blue/yellow) with comic-book halftone shading. 
    Style: Cross between [Jack Kirby's dynamic poses] and [Bruce Timm's clean lines]. 
    Add speed lines, sound effects, and a dramatic spotlight.`;

    const imgElement = gridItem.querySelector(".generated-image");
    const loadingContainer = gridItem.querySelector(".loading-container");
    
    const position = Array.from(document.querySelectorAll(".grid-item")).indexOf(gridItem); 

    // Show the loading animation for this grid-item
    loadingContainer.classList.remove("hidden");

    const formData = new FormData();
	formData.append("username", localStorage.getItem('username'));
    formData.append("userID", localStorage.getItem('userID'));
    formData.append("prompt", prompt);
    formData.append("createAvatar", false);
    formData.append("position", position);
	formData.append("description", description);
    formData.append("temporary", false);

    try {
        // Generate photo through /generatePhoto endpoint
        const response = await fetch("/generatePhoto", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        if (!result.success) {
            console.error("Error generating image:", result.message);
            return false;
        }

        await saveImage(localStorage.getItem("userID"), result.imageObjects, false);

        // delete grid-item and replace it with the new panel
        gridItem.remove();
        createPanel(result.imageUrl, true, position);
        imgElement.src = result.imageUrl;
    } catch (error) { 
        console.error("Error generating image:", error);
        imgElement.src = 'imgs/errorwarning.webp'; // Fallback image
        return false;
    } finally {
        // Hide the loading animation for this grid-item
        loadingContainer.classList.add("hidden");
    }

    document.querySelectorAll(".event-submit").forEach((button) => (button.disabled = false));
    addPanelBtn.disabled = false;
    deletePanelBtn.disabled = false;
}

async function saveImage(userID, imageObjects, updateDB) {
    // update imageObjects order
    imageObjects.forEach((imageObject, index) => {
        imageObject.order = index;
    });
    localStorage.setItem("imageObjects", JSON.stringify(imageObjects));
    if (updateDB) {
        try {
            const response = await fetch('/saveImages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userID, imageObjects })
            });
            if (!response.ok) {
                throw new Error('Failed to save images');
            }
        } catch (error) {
            console.error("Error saving images:", error);
        }
    }
}

// 1  +  3  2  3  4  5
