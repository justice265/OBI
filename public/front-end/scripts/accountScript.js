(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            $('#spinner').removeClass('show');
        }, 1);
    };
    spinner();

    // Initiate the wowjs
    new WOW().init();

    // Sticky Navbar
    $(window).scroll(function () {
        $('.sticky-top').css('top', ($(this).scrollTop() > 300) ? '0px' : '-100px');
    });

    // Back to top button
    $(window).scroll(function () {
        $('.back-to-top').fadeIn($(this).scrollTop() > 300 ? 'slow' : 'slow');
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

    document.addEventListener('DOMContentLoaded', async function () {
        try {
            // Fetch user details from the server
            const response = await fetch('/user/details', {
                method: 'GET',
                credentials: 'same-origin' // Include cookies in the request
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user details (HTTP status: ${response.status})`);
            }

            const userData = await response.json();

            document.getElementById('usernameDisplay').textContent = userData.username;
            document.getElementById('maritalStatusDisplay').textContent = userData.marital_status;
            document.getElementById('ageDisplay').textContent = userData.age;
            document.getElementById('maxQualificationDisplay').textContent = userData.max_qualification;
        } catch (error) {
            console.error('Error fetching user details:', error);
            // Handle errors if any (e.g., display an error message to the user)
        }
    });

    // Toggle visibility of posted jobs section
    $('#togglePostedJobsBtn').click(function () {
        $('#postedJobsSection').toggle();
        if ($('#postedJobsSection').is(':visible')) {
            fetchPostedJobs();
        }
    });

    // Fetch user's posted jobs from the server
    function fetchPostedJobs() {
        // Make an AJAX request to fetch user's posted jobs
        $.get('/user/jobs', function (response) {
            if (response && response.jobs) {
                var jobsHTML = '<div class="container"><h1 class="text-center mb-5">Your Posted Jobs</h1>';
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
                $('#postedJobsSection').html(jobsHTML);

                // Attach event listeners for delete buttons
                $('.delete-job-btn').click(function () {
                    var jobId = $(this).data('job-id');
                    deleteJob(jobId);
                });
            }
        });
    }

    // Event listener for edit job buttons
    $(document).on('click', '.edit-job-btn', function () {
        var jobId = $(this).data('job-id');
        editJob(jobId);
    });

    // Function to edit job details
    function editJob(jobId) {
        // Make an AJAX request to fetch the job details based on the jobId
        $.get('/jobs/' + jobId, function (jobDetails) {
            if (jobDetails) {
                // Populate the form fields with the job details
                $('#jobTitle').val(jobDetails.job_title);
                $('#jobDescription').val(jobDetails.job_description);
                $('#jobLocation').val(jobDetails.job_location);
                $('#jobType').val(jobDetails.job_type);
                $('#jobCategory').val(jobDetails.job_category);
                $('#closingDate').val(jobDetails.closing_date);
                $('#companyName').val(jobDetails.company_name);
                $('#contactEmail').val(jobDetails.contact_email);
                $('#companyWebsite').val(jobDetails.company_website);
                $('#companyDescription').val(jobDetails.company_description);

                // Display the submit button for updating the job
                $('#postedJobsSection').hide();
                $('#submitJobBtn').hide();
                $('#updateJobBtn').show();

                // Store the jobId in a hidden input field
                $('#jobId').val(jobId);
            }
        });
    }

    // Function to update job details
    function updateJob() {
        var jobId = $('#jobId').val();
        // Get the updated values from the form
        var updatedJobDetails = {
            jobTitle: $('#jobTitle').val(),
            jobDescription: $('#jobDescription').val(),
            jobLocation: $('#jobLocation').val(),
            jobType: $('#jobType').val(),
            jobCategory: $('#jobCategory').val(),
            closingDate: $('#closingDate').val(),
            companyName: $('#companyName').val(),
            contactEmail: $('#contactEmail').val(),
            companyWebsite: $('#companyWebsite').val(),
            companyDescription: $('#companyDescription').val()
        };
        // Make an AJAX request to update the job details on the server
        $.ajax({
            url: '/jobs/' + jobId,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedJobDetails),
            success: function () {
                // Job details updated successfully
                fetchPostedJobs();
                // Hide the modal or close the form
                // Reset the form fields
            },
            error: function () {
                console.error('Error updating job');
                alert('Failed to update job. Please try again later.');
            }
        });
    }

    // Function to delete a job post
    function deleteJob(jobId) {
        // Confirm deletion with user
        var confirmDelete = confirm("Are you sure you want to delete this job post?");
        if (!confirmDelete) {
            return; // If user cancels, do nothing
        }
        // Make an AJAX request to delete the job post
        $.ajax({
            url: '/jobs/' + jobId,
            type: 'DELETE',
            success: function () {
                // Job post deleted successfully
                fetchPostedJobs(); // Refresh the posted jobs section
            },
            error: function () {
                console.error('Error deleting job post');
                alert('Failed to delete job post. Please try again later.');
            }
        });
    }

})(jQuery);