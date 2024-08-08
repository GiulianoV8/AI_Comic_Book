document.addEventListener('DOMContentLoaded', () => {
    const preSetTitleBtn = document.getElementById('preSetTitleBtn');
    const titleInputContainer = document.getElementById('titleInputContainer');
    const titleInput = document.getElementById('titleInput');
    const submitTitleBtn = document.getElementById('submitTitleBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const modal = document.getElementById('editAttributesModal');
    const editHeroBtn = document.getElementById('editAttributesBtn');
    const span = document.getElementsByClassName('close')[0];
    const attributeForm = document.getElementById('editAttributesForm');
    const attributesContainer = document.getElementById('attributesContainer');
    const addAttributeBtn = document.getElementById('addAttributeBtn');

    let userID = localStorage.getItem('userID'); // Replace with the actual userID

    editHeroBtn.onclick = async function() {
        modal.style.display = 'block';
        
        // Fetch user's current attributes
        try {
            const response = await fetch(`/getUserAttributes?userID=${userID}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            // Clear existing attributes
            attributesContainer.innerHTML = '';

            // Populate form with current attributes
            for (const attribute of data) {
                addAttributeInput(attribute);
            }
        } catch (error) {
            console.error('Error fetching user attributes:', error);
        }
    }

    span.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    addAttributeBtn.onclick = () => addAttributeInput('');

    attributeForm.onsubmit = async function(event) {
        event.preventDefault();

        const attributes = [];
        const inputs = attributesContainer.querySelectorAll('.attribute-input');

        inputs.forEach(input => {
            attributes.push(input.querySelector('.attribute').value)
        });

        try {
            const response = await fetch('/editAttributes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userID, attributes })
            });

            if (response.ok) {
                alert('Attributes updated successfully!');
                modal.style.display = 'none';
            } else {
                alert('Error updating attributes');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function addAttributeInput(value) {
        console.log(value);
        const div = document.createElement('div');
        div.className = 'form-group attribute-input';

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.className = 'attribute';
        valueInput.placeholder = 'Attribute';
        valueInput.value = value;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => div.remove();

        div.appendChild(valueInput);
        div.appendChild(deleteBtn);

        attributesContainer.appendChild(div);
    }

    logoutBtn.addEventListener('click', () => localStorage.clear());

    preSetTitleBtn.addEventListener('click', async () => {
        if (!titleInputContainer.classList.contains('visible')) {
            titleInput.placeholder = localStorage.getItem('comicTitle') || 'Comic Book Title';

            titleInputContainer.classList.add('visible');
            titleInputContainer.classList.remove('hidden');
        } else {
            titleInputContainer.classList.remove('visible');
            titleInputContainer.classList.add('hidden');
        }
    }); 

    submitTitleBtn.addEventListener('click', async () => {
        const newTitle = titleInput.value.trim();
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
                titleInputContainer.classList.remove('visible');
            } else {
                alert('Error updating title');
            }
        } else {
            alert('Please enter a title');
        }
    });
});
