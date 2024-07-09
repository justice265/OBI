document.addEventListener('DOMContentLoaded', function() {
    // Loop through all buttons with IDs applyBtn1 to applyBtn7
    for (let i = 1; i <= 7; i++) {
        let btnId = 'applyBtn' + i;
        let btn = document.getElementById(btnId);
        
        // Add click event listener to each button
        btn.addEventListener('click', function() {
            window.location.href = '/apply'; // Change the URL to your desired route
        });
    }
});