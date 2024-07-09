(function ($) {
  // Handle form submission
  $('#signUpForm').submit(async function (event) {
     event.preventDefault(); // Prevent default form submission
 
     const formData = new FormData(this); // Get form data
     const url = '/register'; // Server endpoint URL
 
     try {
         const response = await fetch(url, {
             method: 'POST',
             body: formData
         });
 
         if (response.ok) {
             const result = await response.text();
             alert(result); // Show success message or handle as needed
         } else {
             throw new Error('Failed to submit job');
         }
     } catch (error) {
         console.error('Error submitting job:', error);
         alert('An error occurred. Please try again later.');
     }
 });
 })(jQuery);