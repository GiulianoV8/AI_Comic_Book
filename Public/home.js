import { NovitaSDK, TaskStatus } from 'novita-sdk';

const novitaClient = new NovitaSDK("df06b948-2b6d-465f-b997-c6cb900bd551");

document.addEventListener("DOMContentLoaded", function() {
    const xBtn = document.getElementById("xBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const dropdown = document.getElementById('deleteDropdown');
    let deleteMode = false;
    let selectedItems = [];

    const gridContainer = document.getElementById("gridContainer");
    const addGridItemBtn = document.getElementById("addGridItemBtn");
    const deleteGridItemBtn = document.getElementById("deleteGridItemBtn");

    const comicTitle = document.getElementById("comic-title");
    const editTitleBtn = document.getElementById("edit-title-btn");
    const saveTitleBtn = document.getElementById("save-title-btn");
    const cancelTitleBtn = document.getElementById("cancel-title-btn");

    userID = localStorage.getItem("userID");
    fillData(userID);

    let previousTitle = comicTitle.innerText;

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

    // Add new grid item on "Add Grid Item" button click
    addGridItemBtn.addEventListener("click", function() {
        const newGridItem = document.createElement("div");
        newGridItem.classList.add("grid-item");
        newGridItem.innerHTML = `
            <div class="scribble-container">
                <img class="pencil hidden" src="imgs/pencil_icon_transparent.webp">
            </div>
            <img class="generated-image" src="">
            <form class="input-container" onSubmit="submitEvent(this, description.value)">
                <input class="event-input" type="text" name="description" placeholder="Event">
                <button class="event-submit" type="submit">
                    <img src="imgs/pencil_icon.jpeg" alt="Submit" class="submit-image">
                </button>
            </form>
        `;
        gridContainer.insertBefore(newGridItem, document.querySelector(".grid-item.create")); // Insert before the "Create" grid item
    });

    // Delete the last grid item (except the "Create" grid item) on "Delete Grid Item" button click
    deleteGridItemBtn.addEventListener("click", function() {
        const gridItems = gridContainer.querySelectorAll(".grid-item:not(.create)");
        if (gridItems.length > 0) {
            gridContainer.removeChild(gridItems[gridItems.length - 1]); // Remove the last grid item
        }
    });

    xBtn.addEventListener("click", function() {
        dropdown.classList.toggle('hidden');
        console.log('Dropdown toggled');
        if (!deleteMode) {
            deleteMode = true;
            document.querySelectorAll(".grid-item").forEach(item => {
                if(!item.classList.contains("create")){ 
                    let circle = document.createElement("div");
                    circle.classList.add("circle");
                    circle.style.display = "block";
                    circle.addEventListener("click", function() {
                        console.log("Selecting for deletion");
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

    // Hide dropdown and perform deletion when delete button is clicked
    deleteBtn.addEventListener("click", function() {
        dropdown.classList.add('hidden');
        selectedItems.forEach(item => {
            let img = item.querySelector('.generated-image');
            if (img) { img.remove(); }
        });
        document.querySelectorAll(".grid-item .circle").forEach(circle => circle.remove());
        document.querySelectorAll(".highlight").forEach(highlight => highlight.classList.remove("highlight"));
        // Reset delete mode and close dropdown
        deleteMode = false;
        selectedItems = [];
    });

    // Prevent default form submission
    let forms = document.querySelectorAll(".input-container");
    forms.forEach(item => item.addEventListener("submit", e => e.preventDefault()));
});

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
        if(localStorage.getItem('imageUrls')){
            imageUrls = JSON.parse(localStorage.getItem('imageUrls'));
        }else{
            imageUrls = userData.images;
            localStorage.setItem('images', JSON.stringify(imageUrls));
        }
        
        // Set user;s attributes
        let attributes;
        if(localStorage.getItem('attributes')){
            attributes = JSON.parse(localStorage.getItem('attributes'));
        }else{
            attributes = userData.attributes;
            localStorage.setItem('attributes', JSON.stringify(attributes));
        }
        // Fill in each .generated-img img tag's src attribute with the corresponding url
        const generatedImgs = document.querySelectorAll('.generated-img img');
        generatedImgs.forEach((img, index) => {
            if (imageUrls[index]) {
                img.src = imageUrls[index];
            }
        });
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
                            .then(result => {
                                const imageUrl = result.images[0].image_url;
                                pencil.classList.add('hidden');
                                imgElement.src = imageUrl;
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
