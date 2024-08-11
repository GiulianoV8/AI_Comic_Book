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
        stringedAttributes += `${attribute}, \n`;
    }
    generateImage(selectedPanel, pencil, description);
}

async function generateImage(imgElement, pencil, description, attributes) {
    const apiKey = 'your-api-key-here';
    const url = 'https://api.novita.ai/v3/lcm-txt2img';

    const data = {
        prompt: `In a comic-book theme, a superhero with the following attributes: \n ${attributes} did this: ${description}`,
        height: 512,
        width: 512,
        image_num: 1,
        steps: 8,
        guidance_scale: 1.5
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        const imageUrl = result.images[0];
        pencil.classList.add('hidden');
        imgElement.src = imageUrl;
    } catch (error) {
        console.error('Error:', error);
    }
}
