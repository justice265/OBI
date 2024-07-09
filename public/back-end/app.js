const express = require('express');
const app = express();
const secretKey = require('./auth');
const nodemailer = require('nodemailer');
const port = 3000;
const { check, validationResult } = require('express-validator');
const session = require('express-session');
const db = require('./db');
const multer = require('multer');
const bcrypt = require('bcrypt');
const pool = require('./db'); 
const { hashPassword } = require('./utils');
const path = require('path');
const bodyParser = require('body-parser');
const upload = multer();
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Add this for JWT

// Use CORS middleware
app.use(cors());

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set secure to true if using HTTPS
}));

require('dotenv').config(); // Load environment variables from .env
const { createTables } = require('./migrate');

// Configure body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'front-end' directory
app.use(express.static(path.join(__dirname, '../front-end')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/html/home.html'));
});
app.get('/apply.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/html/apply.html'));
});
app.get('/job-details.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/html/job-details.html'));
});
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/html/index.html'));
});
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/html/homepage.html'));
});
app.get('/post', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/html/post.html'));
});
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/html/account.html'));
});
app.get('/signUp', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/html/signUp.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/html/login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../front-end/html/admin_interface.html'));
});

// Middleware to parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register section
app.post('/register', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 }
]), async (req, res) => {
  try {
    const { username, password, confirm, maritalStatus, age, maxQualification } = req.body;

    // Validate if password and confirm password match
    if (password !== confirm) {
      res.status(400).send('Passwords do not match');
      return;
    }

    // Validate if username is in email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      res.status(400).send('Invalid email address');
      return;
    }

    // Hash the password using the hashPassword function from utils.js
    const hashedPassword = await hashPassword(password);

    // Access the uploaded files
    const cv = req.files['cv'] ? req.files['cv'][0].buffer : null;
    const profilePicture = req.files['profilePicture'] ? req.files['profilePicture'][0].buffer : null;

    // Store the user in the database
    const result = await pool.query('INSERT INTO users (username, password, marital_status, age, max_qualification, profile_picture, cv) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [username, hashedPassword, maritalStatus, age, maxQualification, profilePicture, cv]);
    const userId = result.rows[0].id;

    // Store user ID in the session
    req.session.userId = userId;

    res.status(201).send('User registered successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// JWT verify token section
function verifyToken(req, res, next) {
  // Extract the JWT token from the request header
  const authorizationHeader = req.header('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized');
  }

  const token = authorizationHeader.split('Bearer ')[1];

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, secretKey);
    req.userId = decoded.userId; // Attach the user ID to the request object
    next(); // Call next middleware or route handler
  } catch (error) {
    return res.status(401).send('Unauthorized');
  }
}

async function addAdminUser(username, password) {
  try {
    // Check if the admin user already exists
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);

    if (result.rows.length > 0) {
      console.log('Admin user already exists.');
      return;
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new admin user into the database
    const insertResult = await pool.query(
      'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, true]
    );

    const userId = insertResult.rows[0].id;
    console.log(`Admin user created successfully with ID: ${userId}`);
  } catch (error) {
    console.error('Error adding admin user:', error);
  }
}

// Example usage
addAdminUser('john@munta.com', '12345678');


app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Retrieve user from the database
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).send('Incorrect username or password');
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send('Incorrect username or password');
    }

    // Store user ID and admin status in the session
    req.session.userId = user.id;
    req.session.isAdmin = user.is_admin;

    res.json({ message: 'Login successful', is_admin: user.is_admin });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Protected route
app.get('/protected', verifyToken, async (req, res) => {
  // If token is valid, send the decoded information
  res.json(req.userId);
});

// Post Jobs 
app.post('/submit-job', upload.single('companyLogo'), async (req, res) => {
  try {
    const {
      jobTitle,
      job_description,
      company_description,
      jobLocation,
      jobType,
      jobCategory,
      closingDate,
      companyName,
      companyWebsite,
      tagline,
      videoLink,
      twitter,
      contactEmail,
      salary,
      salaryCurrency,
      salaryUnit,
      remotePosition
    } = req.body;

    const companyLogo = req.file ? req.file.buffer : null;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).send('Unauthorized');
    }

    await pool.query(`
      INSERT INTO job_posts (job_title, job_description, company_description, job_location, job_type, job_category, closing_date, company_name, company_website, 
      tagline, video_link, twitter, company_logo, contact_email, salary, salary_currency, salary_unit, remote_position, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `, [
      jobTitle,
      job_description,
      company_description,
      jobLocation,
      jobType,
      jobCategory,
      closingDate,
      companyName,
      companyWebsite,
      tagline,
      videoLink,
      twitter,
      companyLogo,
      contactEmail,
      salary,
      salaryCurrency,
      salaryUnit,
      remotePosition === 'on', // Convert checkbox value to boolean
      userId
    ]);

    res.status(201).send('Job post submitted successfully.');
  } catch (error) {
    console.error('Error submitting job post:', error);
    res.status(500).send('Internal Server Error');
  }
});

//Get all approved jobs
app.get('/admin/approved-jobs', async (req, res) => {
  try {
    const jobs = await pool.query(`
      SELECT id, job_title, job_description, job_location, job_type, job_category, closing_date, company_name, company_website, company_description, contact_email, company_logo 
      FROM job_posts WHERE is_authorized = true
    `);

    const jobsWithLogos = await Promise.all(jobs.rows.map(async job => {
      if (job.company_logo) {
        const base64Data = Buffer.from(job.company_logo, 'binary').toString('base64');
        return { ...job, company_logo: base64Data };
      } else {
        return job;
      }
    }));

    res.json({ jobs: jobsWithLogos });
  } catch (error) {
    console.error('Error fetching job posts:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Get individual jobs by ID
app.get('/jobs/:id', async (req, res) => {
  try {
    const jobId = req.params.id;

    const result = await pool.query(`
      SELECT job_title, job_description, job_location, job_type, job_category, closing_date, company_name, company_website, company_description, contact_email, company_logo 
      FROM job_posts WHERE id = $1 AND is_authorized = true
    `, [jobId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Job post not found');
    }

    const job = result.rows[0];

    if (job.company_logo) {
      const base64Data = Buffer.from(job.company_logo, 'binary').toString('base64');
      job.company_logo = base64Data;
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job post:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Approve a job post (admin only)
app.put('/jobs/:id/approve', verifyToken, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.userId;

    // Check if the user is an admin
    const userResult = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user || !user.is_admin) {
      return res.status(403).send('Unauthorized');
    }

    // Update the job post to set is_authorized to true
    await pool.query('UPDATE job_posts SET is_authorized = true WHERE id = $1', [jobId]);

    res.send('Job post approved successfully');
  } catch (error) {
    console.error('Error approving job post:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Approve or reject a job post (admin only)
app.post('/admin/approve-job', async (req, res) => {
  try {
    const { jobId, approvalStatus } = req.body;
    const userId = req.session.userId;

    // Check if the user is an admin
    const userResult = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user || !user.is_admin) {
      return res.status(403).send('Unauthorized');
    }

    // Update the job post based on the approval status
    const isAuthorized = approvalStatus === 'approved';
    await pool.query('UPDATE job_posts SET is_authorized = $1 WHERE id = $2', [isAuthorized, jobId]);

    res.send('Job post status updated successfully');
  } catch (error) {
    console.error('Error updating job post status:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Get all pending job posts (admin only)
app.get('/admin/pending-jobs', async (req, res) => {
  try {
    const userId = req.session.userId;

    // Check if the user is logged in
    if (!userId) {
      return res.status(401).send('Unauthorized');
    }

    // Retrieve user details from the database
    const userResult = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Check if the user is an admin
    if (!user || !user.is_admin) {
      return res.status(403).send('Unauthorized');
    }

    // Retrieve all pending job posts
    const result = await pool.query('SELECT * FROM job_posts WHERE is_authorized = false');

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching job posts:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get jobs posted by the current user
app.get('/user/jobs', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).send('Unauthorized');
    }

    // Query the database to get job posts posted by the user
    const queryResult = await pool.query('SELECT * FROM job_posts WHERE user_id = $1', [req.session.userId]);

    // Send the fetched job data as JSON response
    res.json({ jobs: queryResult.rows }); // Assuming queryResult.rows contains the array of job objects
  } catch (error) {
    console.error('Error fetching user\'s job posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define the '/send' endpoint
app.post('/send',
  upload.array('attachments'), // Ensure the field name matches the form
  [
      check('email').isEmail().withMessage('Invalid Email Address'),
      check('subject').notEmpty().withMessage('Subject is required'),
      check('message').notEmpty().withMessage('Message is required')
  ],
  async (request, response) => {
      const errors = validationResult(request);

      if (!errors.isEmpty()) {
          response.render('contact', { errors: errors.mapped() });
      } else {
          const { email, subject, message } = request.body;
          const attachments = request.files; // Get all files

          async function sendEmail() {
              try {
                  const mailTransporter = nodemailer.createTransport({
                      host: 'smtp.gmail.com',
                      port: 587,
                      secure: false, // true for 465, false for other ports
                      requireTLS: false,
                      tls: {
                        rejectUnauthorized: false
                    },
                      auth: {
                          user: process.env.EMAIL,
                          pass: process.env.EMAIL_PASSWORD,
                      },
                  });

                  const mailDetails = {
                      from: process.env.EMAIL, // Sender's email address from environment variable
                      to: email, // Recipient's email address from form input
                      subject: subject,
                      text: message,
                      attachments: attachments.map(file => ({
                          filename: file.originalname,
                          content: file.buffer,
                          contentType: file.mimetype
                      }))
                  };

                  const info = await mailTransporter.sendMail(mailDetails);
                  console.log('Email sent successfully:', info.response);
                  response.redirect('/success');
              } catch (error) {
                  console.error('Error sending email:', error);
                  response.redirect('/error'); 
              }
          }

          await sendEmail();
      }
  }
);

// Define the '/success' endpoint
app.get('/success', (request, response) => {
  response.send('<h1>Your Message was Successfully Sent!</h1>');
});

// Define the '/error' endpoint
app.get('/error', (request, response) => {
  response.send('<h1>There was an error sending your message. Please try again later.</h1>');
});

// Route to get job details by job ID
app.get('/job-details/:jobId', async (req, res) => {
  const jobId = req.params.jobId;

  try {
      // Log the job ID being requested
      console.log(`Fetching details for job ID: ${jobId}`);

      const result = await db.query('SELECT * FROM job_posts WHERE id = $1', [jobId]);

      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          console.log('Job not found');
          res.status(404).json({ error: 'Job not found' });
      }
  } catch (error) {
      console.error('Error fetching job details:', error);
      res.status(500).json({ error: 'An error occurred while fetching job details. Please try again later.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  createTables();
});
