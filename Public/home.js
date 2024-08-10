document.addEventListener("DOMContentLoaded", function() {
    const xBtn = document.getElementById("xBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const dropdown = document.getElementById('deleteDropdown');
    let deleteMode = false;
    let selectedItems = [];

    const gridContainer = document.getElementById("gridContainer");
    const addGridItemBtn = document.getElementById("addGridItemBtn");
    const deleteGridItemBtn = document.getElementById("deleteGridItemBtn");

    userID = localStorage.getItem("userID");
    fillData(userID);

    // Add new grid item on "Add Grid Item" button click
    addGridItemBtn.addEventListener("click", function() {
        const newGridItem = document.createElement("div");
        newGridItem.classList.add("grid-item");
        newGridItem.innerHTML = `
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
    try {
        // Fetch user data from the backend
        const response = await fetch(`/getUserData?userID=${userID}`);
        const userData = await response.json();

        // Fill in the #comic-title input tag with the comicTitle attribute value
        const comicTitleInput = document.getElementById('comic-title');
        if (comicTitleInput && userData.comicTitle) {
            comicTitleInput.value = userData.comicTitle;
            localStorage.setItem('comicTitle', userData.comicTitle);
        }

        // Get images from the datatable's image urls list attribute
        const imageUrls = userData.imageUrls || [];

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
    form.parentElement.querySelector('.generated-image').src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlrZqTCInyg6RfYC7Ape20o-EWP1EN_A8fOA&s'
}

function titleName(){
    
}
