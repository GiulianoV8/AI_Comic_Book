document.addEventListener("DOMContentLoaded", function() {
    const xBtn = document.getElementById("xBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const dropdown = document.getElementById('deleteDropdown');
    let deleteMode = false;
    let selectedItems = [];

    xBtn.addEventListener("click", function() {
        dropdown.classList.toggle('hidden');
        console.log('Dropdown toggled');
        if (!deleteMode) {
            deleteMode = true;
            document.querySelectorAll(".grid-item").forEach(item => {
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

            document.querySelectorAll(".grid-item .circle").forEach(circle => circle.remove());
        });

        // Reset delete mode and close dropdown
        deleteMode = false;
        selectedItems = [];
    });

    // Prevent default form submission
    let forms = document.querySelectorAll(".input-container");
    forms.forEach(item => item.addEventListener("submit", e => e.preventDefault()));
});

function submitEvent(form, description){
    console.log(description);
    form.parentElement.querySelector('.generated-image').src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlrZqTCInyg6RfYC7Ape20o-EWP1EN_A8fOA&s'
}

function titleName(){
    
}
