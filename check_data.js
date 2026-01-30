
const { Client } = require('pg');
require('dotenv').config();

async function checkData() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL_PROFILES,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database PROFILES');

        console.log('\n--- User References ---');
        const userRes = await client.query('SELECT id, name, email, status, role_id FROM user_reference');
        userRes.rows.forEach(row => console.log(JSON.stringify(row)));

        console.log('\n--- Student Profiles ---');
        const studentRes = await client.query('SELECT id, user_id, career_id FROM student_profile');
        studentRes.rows.forEach(row => console.log(JSON.stringify(row)));

        console.log('\n--- Subject References ---');
        const subjectRes = await client.query('SELECT id, name, capacity FROM subject_reference');
        subjectRes.rows.forEach(row => console.log(JSON.stringify(row)));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

checkData();
