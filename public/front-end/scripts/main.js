(function ($) {
    "use strict";

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

    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: true,
        margin: 24,
        dots: true,
        loop: true,
        nav: false,
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            }
        }
    });

    // Function to fetch and display jobs
    async function fetchAndDisplayJobs() {
        try {
            const response = await fetch('/admin/approved-jobs');
            if (!response.ok) {
                throw new Error(`Failed to fetch job data (HTTP status: ${response.status})`);
            }

            const data = await response.json(); // Parse JSON response

            const jobListElement = document.getElementById('jobList');
            let jobCount = 0; // Initialize job count

            data.jobs.forEach(job => { // Assuming 'jobs' is the key containing your job data
                // Check if job row has empty values
                const isEmptyRow = Object.values(job).some(value => value === null || value === '');

                if (!isEmptyRow) {
                    const jobItem = createJobItemElement(job);
                    jobListElement.appendChild(jobItem);
                    jobCount++; // Increment job count for each displayed job
                }
            });

            console.log(`Total jobs fetched: ${jobCount}`); // Log the total job count
        } catch (error) {
            console.error('Error fetching job data:', error);
            alert('An error occurred while fetching job data. Please try again later.');
        }
    }

    // Initialize global variable to track displayed job count
    let displayedJobCount = 0;

   // Function to create a job item element
function createJobItemElement(job) {
    const jobItem = document.createElement('div');
    jobItem.classList.add('job-item', 'p-4', 'mb-4');

    jobItem.innerHTML = `
    <div class="row g-4">
        <div class="col-sm-12 col-md-8 d-flex align-items-center">
            <!-- Set src attribute to a data URL representing the image in binary format -->
            <img class="flex-shrink-0 img-fluid border rounded" src="data:image/jpeg;base64,${job.company_logo}" alt="" style="width: 80px; height: 80px;">
            <div class="text-start ps-4">
                <h5 class="mb-3"><a href="job-details.html?jobId=${job.id}" class="job-title-link">${job.job_title}</a></h5>
                <span class="text-truncate me-3"><i class="fa fa-map-marker-alt text-primary me-2"></i>${job.job_location}</span>
                <span class="text-truncate me-3"><i class="far fa-clock text-primary me-2"></i>${job.job_type}</span>
            </div>
        </div>
        <div class="col-sm-12 col-md-4 d-flex flex-column align-items-start align-items-md-end justify-content-center">
            <div class="d-flex mb-3">
                <button class="btn btn-light btn-square me-3 save-job-btn" data-job-id="${job.id}"><i class="far fa-heart text-primary"></i></button>
                <a class="btn apply-btn btn-primary">Apply Now</a>
            </div>
            <small class="text-truncate"><i class="far fa-calendar-alt text-primary me-2"></i>Date Line: ${job.closing_date}</small>
        </div>
    </div>
    `;

    // Increment displayed job count
    displayedJobCount++;
    console.log(`Displayed job count: ${displayedJobCount}`); // Log the current count of displayed jobs

    // Add event listener to the save job button
    const saveJobButton = jobItem.querySelector('.save-job-btn');
    saveJobButton.addEventListener('click', function() {
        const jobId = this.getAttribute('data-job-id');
        saveJob(jobId);
    });

    // Add event listener to the apply button
    const applyButton = jobItem.querySelector('.apply-btn');
    applyButton.addEventListener('click', function() {
        window.location.href = 'apply.html?jobId=' + job.id;
    });

    return jobItem;
}


    // Function to save a job
    function saveJob(jobId) {
        // Send an AJAX request to save the job with the given job ID
        $.ajax({
            url: '/save-job', // Endpoint to save the job
            method: 'POST',
            data: { jobId: jobId }, // Data to send with the request (job ID)
            success: function (response) {
                // Handle success response
                alert(response); // Show success message or handle as needed
            },
            error: function (xhr, status, error) {
                // Handle error response
                console.error('Error saving job:', error);
                alert('An error occurred while saving the job. Please try again later.');
            }
        });
    }

    // Fetch and display jobs when the document is ready
    $(document).ready(function () {
        fetchAndDisplayJobs();
    });

    // Handle form submission
    $('#jobForm').submit(async function (event) {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(this); // Get form data
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
})(jQuery);