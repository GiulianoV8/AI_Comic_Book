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

    if(!localStorage.getItem('userID')){
        window.location.replace("/login.html")
    }
    userID = localStorage.getItem("userID");
    fillData(userID);

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
    }

    // Toggle add panel mode on "Add Panel" button click
    addPanelBtn.addEventListener("click", function() {
        addPanelMode = !addPanelMode;
        if (addPanelMode) {
            showPlusButtons();
            addPanelBtn.innerText = "Exit Add Panel Mode";  // Change button text
        } else {
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
                alert('Title updated successfully');
                previousTitle = newTitle;
                comicTitle.contentEditable = false;
                editTitleBtn.style.display = "inline-block";
                saveTitleBtn.style.display = "none";
                cancelTitleBtn.style.display = "none";
            } else {
                alert('Error updating title');
            }
            localStorage.setItem('comicTitle', newTitle);
        } else {
            alert('Please enter a title');
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
            let img = item.querySelector('.generated-image');
            if (img && img.src) {
                await deleteImageUrl(img.src);
            }
            item.remove();
        }
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
                await deleteImageUrl(img.src);
            }
            item.remove();
        }
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
    try {
        console.log('deleting image ' + imgSrc);
        // Send a request to delete the image URL from DynamoDB
        const response = await fetch('/deleteImageUrl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: localStorage.getItem('userID'),
                imageUrl: imgSrc
            })
        });
        const result = await response.json();
        if (result.success) {
            let imageUrls = JSON.parse(localStorage.getItem('imagesUrls')) || [];
            console.log(imageUrls); 
            updatedImageUrls = imageUrls.filter(url => !imgSrc.includes(url));
            localStorage.setItem('imageUrls', JSON.stringify(updatedImageUrls));
        } else {
            console.error("Error removing image URL from DynamoDB:", result.message);
        }
    } catch (error) {
        console.error("Error during deletion request:", error);
    }
}

async function fillData(userID) {
    console.log('Filling Data');
    try {
        // Fetch user data from the backend
        const response = await fetch(`/getUserData?userID=${userID}`);
        const userData = await response.json();
        // Fill in the #comic-title input tag with the comicTitle attribute value
        const comicTitle = document.getElementById('comic-title');
        if (comicTitle && userData.comicTitle) {
            comicTitle.innerText = userData.comicTitle;
            localStorage.setItem('comicTitle', userData.comicTitle);
        }
        // Get images from the datatable's image urls list attribute
        let imageUrls;
        if(localStorage.getItem('imageUrls') && localStorage.getItem('imageUrls') !== 'undefined' && localStorage.getItem('imageUrls') !== undefined) {
            imageUrls = JSON.parse(localStorage.getItem('imageUrls'));
        }else{
            imageUrls = userData.imageUrls;
            localStorage.setItem('imageUrls', JSON.stringify(imageUrls));
        }
        let insertIndex = 0;
        for(const imageUrl of imageUrls) {
            createPanel(imageUrl, true, insertIndex);
            insertIndex++;
        }
        
        // Set user's attributes
        let attributes;
        if(localStorage.getItem('attributes')){
            attributes = JSON.parse(localStorage.getItem('attributes'));
        }else{
            attributes = userData.attributes;
            localStorage.setItem('attributes', JSON.stringify(attributes));
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

function submitEvent(form, description){
    event.preventDefault()
    console.log(description);

    const selectedPanel = form.parentElement.querySelector('.generated-image');

    const pencil = form.parentElement.querySelector('.pencil');
    pencil.classList.remove('hidden');

    let stringedAttributes = "";
    for (const attribute of JSON.parse(localStorage.getItem('attributes'))) {
        stringedAttributes += `${attribute},\n`;
    }
    generateImage(selectedPanel, pencil, description.trim(), stringedAttributes);
}

async function generateImage(imgElement, pencil, description, attributes) {
    const {NovitaSDK, TaskStatus} = require('novita-sdk');
    const novitaClient = new NovitaSDK('df06b948-2b6d-465f-b997-c6cb900bd551')
    const params = {
        extra: {
            test_mode: {
                enabled: true,
                // Set return_task_status to TASK_STATUS_SUCCEED to test the success response.
                // Set return_task_status to TASK_STATUS_FAILED to test the error response.
                return_task_status: 'TASK_STATUS_SUCCEED'
            }
        },
        request: {
            model_name: "rainbowpatch_V10.safetensors",
            prompt: `In a comic-book style, a person with the following attributes:{${attributes} and casual clothing\n} ${description}`,
            negative_prompt: "nsfw",
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

    novitaClient.txt2ImgV3(params)
        .then((res) => {
            if (res && res.task_id) {
                const timer = setInterval(() => {
                    novitaClient.progressV3({
                        task_id: res.task_id,
                    })
                    .then((progressRes) => {
                        if (progressRes.task.status === TaskStatus.SUCCEED) {
                            console.log("Task succeeded!");

                            // Fetch the result using the task_id
                            fetch(`https://api.novita.ai/v3/async/task-result?task_id=${res.task_id}`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': 'Bearer df06b948-2b6d-465f-b997-c6cb900bd551',
                                    'Content-Type': 'application/json',
                                },
                            })
                            .then(response => response.json())
                            .then(async result => {
                                const imageUrl = result.images[0].image_url;
                                pencil.classList.add('hidden');
                                imgElement.src = imageUrl;
                                await saveImage(localStorage.getItem('userID'));
                                clearInterval(timer);
                            })
                            .catch(err => {
                                console.error("Error fetching task result:", err);
                                clearInterval(timer);
                            });
                        }

                        if (progressRes.task.status === TaskStatus.FAILED) {
                            console.warn("Task failed:", progressRes.task.reason);
                            clearInterval(timer);
                        }

                        if (progressRes.task.status === TaskStatus.QUEUED) {
                            console.log("Task is queued.");
                        }
                    })
                    .catch((err) => {
                        console.error("Progress error:", err);
                        clearInterval(timer);
                    });
                }, 1000);
            }
        })
        .catch((err) => {
            console.error("txt2Img error:", err);
        });
}
async function saveImage(userID) {
    try {
        let imageUrls = [];
        for(const image of document.querySelectorAll('.generated-image')) {
            if(!image.src.includes("imgs/blank_white.jpeg")){
                imageUrls.push(image.src);
            }
        }
        const response = await fetch('/saveImageUrl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: userID,
                imageUrls: imageUrls
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
