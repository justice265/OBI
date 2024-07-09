document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    // Handle form submission
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        // Get form data
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const formData = { username, password }; // Create an object with username and password
        // Send form data to server
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert('Login Successful!'); // Display success message
            
            // Redirect based on admin status
            if (data.is_admin) {
                window.location.href = 'admin'; // Redirect to the admin page
            } else {
                window.location.href = 'index'; // Redirect to the index page
            }
        })
        .catch(error => {
            console.error('There was a problem with your fetch operation:', error);
            alert('Login Failed!'); // Display error message
        });
    });
});
