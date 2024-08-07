document.addEventListener('DOMContentLoaded', () => {
    const preSetTitleBtn = document.getElementById('preSetTitleBtn');
    const titleInputContainer = document.getElementById('titleInputContainer');
    const titleInput = document.getElementById('titleInput');
    const submitTitleBtn = document.getElementById('submitTitleBtn');
    const logoutBtn = document.getElementById('logoutBtn');

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
                body: JSON.stringify({ userID: localStorage.getItem('userID'), comicTitle: newTitle })
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
