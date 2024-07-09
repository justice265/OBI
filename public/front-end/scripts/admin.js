document.addEventListener('DOMContentLoaded', function () {
    // Initialize sidenav
    var elems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(elems);
    
    // Initialize tabs
    var tabs = document.querySelectorAll('.tabs');
    M.Tabs.init(tabs);

    fetchPendingJobs();
    fetchApprovedJobs();
});

async function fetchPendingJobs() {
    try {
        const response = await fetch('/admin/pending-jobs', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pending jobs');
        }

        const jobs = await response.json();
        const jobList = document.getElementById('job-list');
        jobList.innerHTML = '';

        jobs.forEach(job => {
            const jobRow = document.createElement('tr');
            jobRow.innerHTML = `
                <td>${job.job_title}</td>
                <td>${job.job_description}</td>
                <td>
                    <button class="btn green approve-btn" data-job-id="${job.id}">Approve</button>
                </td>
            `;
            jobList.appendChild(jobRow);
        });

        document.querySelectorAll('.approve-btn').forEach(button => {
            button.addEventListener('click', function () {
                approveJob(this.dataset.jobId, 'approved');
            });
        });

    } catch (error) {
        alert(error.message);
    }
}

async function approveJob(jobId, status) {
    try {
        const response = await fetch('/admin/approve-job', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ jobId, approvalStatus: status })
        });

        if (!response.ok) {
            throw new Error('Failed to approve/reject job');
        }

        fetchPendingJobs();
        fetchApprovedJobs(); // Refresh the approved jobs list
    } catch (error) {
        alert(error.message);
    }
}

async function fetchApprovedJobs() {
    try {
        const response = await fetch('/admin/approved-jobs', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch approved jobs');
        }

        const data = await response.json();
        const jobs = data.jobs;
        const approvedJobList = document.getElementById('approved-job-list');
        approvedJobList.innerHTML = '';

        jobs.forEach(job => {
            const jobRow = document.createElement('tr');
            jobRow.innerHTML = `
                <td>${job.job_title}</td>
                <td>${job.job_description}</td>
                <td>
                    <button class="btn red reject-btn" data-job-id="${job.id}">Reject</button>
                </td>
            `;
            approvedJobList.appendChild(jobRow);
        });

        document.querySelectorAll('.reject-btn').forEach(button => {
            button.addEventListener('click', function () {
                approveJob(this.dataset.jobId, 'rejected');
            });
        });

    } catch (error) {
        alert(error.message);
    }
}
