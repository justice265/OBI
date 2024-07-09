(function ($) {
    "use strict";

    // Function to toggle the visibility of the posted jobs section
    document.getElementById('togglePostedJobsBtn').addEventListener('click', function () {
        var postedJobsSection = document.getElementById('postedJobsSection');
        if (postedJobsSection.style.display === 'none') {
            // Fetch and display the user's posted jobs
            fetchPostedJobs();
            postedJobsSection.style.display = 'block';
        } else {
            postedJobsSection.style.display = 'none';
        }
    });

    // Event listener for edit job buttons
    $(document).on('click', '.edit-job-btn', function () {
        var jobId = $(this).data('job-id');
        editJob(jobId);
    });

    // Add an event listener to the "Update Job" button
    $('#updateJobBtn').click(function () {
        updateJob(); // Call the updateJob() function
    });

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();

    // Initiate the wowjs
    new WOW().init();

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').css('top', '0px');
        } else {
            $('.sticky-top').css('top', '-100px');
        }
    });

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });

    // Header carousel
    $(".header-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        items: 1,
        dots: true,
        loop: true,
        nav: true,
        navText: [
            '<i class="bi bi-chevron-left"></i>',
            '<i class="bi bi-chevron-right"></i>'
        ]
    });

    // Submit job form handling
    $('#jobPost').submit(async function (event) {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(this); // Get form data

        const userId = $('#userIdDisplay').text(); // Get user ID from display
        formData.append('userId', userId); // Append user ID to form data

        const jobId = $('#jobId').val(); // Get the jobId if available
        if (jobId) {
            formData.append('jobId', jobId); // Append jobId to form data if it exists
        }

        const url = '/submit-job'; // Server endpoint URL

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

    // Function to fetch the user's posted jobs from the server
    function fetchPostedJobs() {
        // Make an AJAX request to fetch user's posted jobs
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/user/jobs', true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                // Parse the JSON response
                var response = JSON.parse(xhr.responseText);
                // Check if jobs array exists in the response
                if (response && response.jobs) {
                    // Generate HTML to display fetched job data
                    var jobsHTML = '<div class="container-fluid"><h1 class="text-center mb-5">Your Posted Jobs</h1>';
                    jobsHTML += '<div class="table-responsive"><table class="table table-striped table-hover">';
                    // Add table headers
                    jobsHTML += '<thead class="thead-dark"><tr>';
                    var headers = Object.keys(response.jobs[0]);
                    headers.forEach(function (header) {
                        if (header !== 'user_id') {
                            jobsHTML += '<th>' + header + '</th>';
                        }
                    });
                    jobsHTML += '<th>Edit</th><th>Delete</th></tr></thead><tbody>';
                    // Add table rows
                    response.jobs.forEach(function (job) {
                        jobsHTML += '<tr>';
                        for (var key in job) {
                            if (key !== 'user_id') {
                                jobsHTML += '<td>' + job[key] + '</td>';
                            }
                        }
                        jobsHTML += '<td><button class="btn btn-primary edit-job-btn" data-job-id="' + job.id + '">Edit</button></td>';
                        jobsHTML += '<td><button class="btn btn-danger delete-job-btn" data-job-id="' + job.id + '">Delete</button></td>';
                        jobsHTML += '</tr>';
                    });
                    jobsHTML += '</tbody></table></div></div>';
                    // Display the fetched job data in the 'postedJobsSection' div
                    var postedJobsSection = document.getElementById('postedJobsSection');
                    postedJobsSection.innerHTML = jobsHTML;

                    // Attach event listeners for delete buttons
                    var deleteButtons = document.getElementsByClassName('delete-job-btn');
                    for (var i = 0; i < deleteButtons.length; i++) {
                        deleteButtons[i].addEventListener('click', function () {
                            var jobId = this.getAttribute('data-job-id');
                            deleteJob(jobId);
                        });
                    }
                }
            }
        };
        xhr.send();
    }

    function editJob(jobId) {
        // Make an AJAX request to fetch the job details based on the jobId
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/jobs/' + jobId, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                // Parse the JSON response
                var jobDetails = JSON.parse(xhr.responseText);
                // Populate the form fields with the job details
                document.getElementById('jobId').value = jobId; // Set the jobId in the hidden input field
                document.getElementById('jobTitle').value = jobDetails.job_title;
                document.getElementById('jobDescription').value = jobDetails.job_description;
                document.getElementById('jobLocation').value = jobDetails.job_location;
                document.getElementById('jobType').value = jobDetails.job_type;
                document.getElementById('jobCategory').value = jobDetails.job_category;
                document.getElementById('closingDate').value = jobDetails.closing_date;
                document.getElementById('companyName').value = jobDetails.company_name;
                document.getElementById('contactEmail').value = jobDetails.contact_email;

                document.getElementById('companyWebsite').value = jobDetails.company_website;
                document.getElementById('companyDescription').value = jobDetails.company_description;
                // Display the submit button for updating the job
                $('#postedJobsSection').hide();
                $('#submitJobBtn').hide();
                $('#updateJobBtn').show();
            }
        };
        xhr.send();
    }

    // Function to delete a job post
    function deleteJob(jobId) {
        // Confirm deletion with user
        var confirmDelete = confirm("Are you sure you want to delete this job post?");

        if (!confirmDelete) {
            return; // If user cancels, do nothing
        }

        // Make an AJAX request to delete the job post
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', '/jobs/' + jobId, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    // Job post deleted successfully
                    fetchPostedJobs(); // Refresh the posted jobs section
                } else {
                    // Failed to delete job post
                    console.error('Error deleting job post');
                    alert('Failed to delete job post. Please try again later.');
                }
            }
        };
        xhr.send();
    }

// Define the updateJob function
function updateJob() {
    var jobId = document.getElementById('jobId').value;
    // Get the updated values from the form
    var updatedJobDetails = {
        jobTitle: document.getElementById('jobTitle').value,
        jobDescription: document.getElementById('jobDescription').value,
        jobLocation: document.getElementById('jobLocation').value,
        jobType: document.getElementById('jobType').value,
        jobCategory: document.getElementById('jobCategory').value,
        closingDate: document.getElementById('closingDate').value,
        companyName: document.getElementById('companyName').value,
        contactEmail: document.getElementById('contactEmail').value,
        companyWebsite: document.getElementById('companyWebsite').value,
        companyDescription: document.getElementById('companyDescription').value
    };
    // Make an AJAX request to update the job details on the server
    var updateXhr = new XMLHttpRequest();
    updateXhr.open('PUT', '/jobs/' + jobId, true);
    updateXhr.setRequestHeader('Content-Type', 'application/json');
    updateXhr.onreadystatechange = function () {
        if (updateXhr.readyState === 4) {
            if (updateXhr.status === 200) {
                // Job details updated successfully
                // You can update the UI or display a success message here
                // For example, you can reload the posted jobs section
                fetchPostedJobs();
                // Hide the modal or close the form
                // Reset the form fields
            } else {
                console.error('Error updating job details:', updateXhr.statusText);
                alert('Failed to update job details. Please try again later.');
            }
        }
    };
    // Send the updated job details to the server
    updateXhr.send(JSON.stringify(updatedJobDetails));
}

})(jQuery);