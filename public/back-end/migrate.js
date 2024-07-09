const db = require('./db');
const pgp = require('pg-promise')();
require('dotenv').config();
// Define the createTables function
async function createTables() {
  try {
    // Create tables if they don't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        marital_status VARCHAR(50),
        age INTEGER,
        max_qualification VARCHAR(100),
        profile_picture BYTEA,
        cv BYTEA,
        unique_number INTEGER,
        is_admin BOOLEAN DEFAULT FALSE
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS job_posts (
        id SERIAL PRIMARY KEY,
        job_title VARCHAR(255) NOT NULL,
        job_description TEXT NOT NULL,
        job_location VARCHAR(255),
        remote_position BOOLEAN,
        job_type VARCHAR(50) NOT NULL,
        video_link VARCHAR(50) NOT NULL,
        twitter VARCHAR(50) NOT NULL,
        job_category VARCHAR(255) NOT NULL,
        closing_date DATE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        company_website VARCHAR(255) NOT NULL,
        company_description TEXT NOT NULL,
        company_logo BYTEA,
        tagline VARCHAR(255),
        contact_email VARCHAR(255) NOT NULL,
        salary NUMERIC,
        salary_currency VARCHAR(50),
        salary_unit VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        is_authorized BOOLEAN DEFAULT FALSE
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS saved_jobs (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES job_posts(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    pgp.end();
  }
}

// Export the createTables function
module.exports = { createTables };
