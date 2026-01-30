
const { Client } = require('pg');
require('dotenv').config();

async function checkData() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL_PROFILES,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log('--- Checking User 1 ---');
        const u1 = await client.query('SELECT * FROM user_reference WHERE id = 1');
        console.log(u1.rows[0]);

        console.log('--- Checking User 7 ---');
        const u7 = await client.query('SELECT * FROM user_reference WHERE id = 7');
        console.log(u7.rows[0]);

        console.log('--- Checking Student Profile for User 7 ---');
        const s7 = await client.query('SELECT * FROM student_profile WHERE user_id = 7');
        console.log(s7.rows[0]);

        console.log('--- Checking Subject 1 ---');
        const sub1 = await client.query('SELECT * FROM subject_reference WHERE id = 1');
        console.log(sub1.rows[0]);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

checkData();
