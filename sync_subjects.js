
const { Client } = require('pg');
require('dotenv').config();

async function syncSubjects() {
    const academicClient = new Client({
        connectionString: process.env.DATABASE_URL_ACADEMIC,
        ssl: { rejectUnauthorized: false }
    });

    const profilesClient = new Client({
        connectionString: process.env.DATABASE_URL_PROFILES,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await academicClient.connect();
        await profilesClient.connect();
        console.log('Connected to both databases');

        // Get subjects from Academic
        const academicRes = await academicClient.query('SELECT id, name, career_id, cicle_number FROM subject');
        console.log(`Found ${academicRes.rows.length} subjects in ACADEMIC`);

        for (const subject of academicRes.rows) {
            console.log(`Syncing subject: ${subject.name} (ID: ${subject.id})`);
            await profilesClient.query(`
        INSERT INTO subject_reference (id, name, career_id, cicle_number, capacity, synced_at)
        VALUES ($1, $2, $3, $4, 30, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          career_id = EXCLUDED.career_id,
          cicle_number = EXCLUDED.cicle_number,
          synced_at = NOW()
      `, [subject.id, subject.name, subject.career_id, subject.cicle_number]);
        }

        console.log('Sync completed successfully');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await academicClient.end();
        await profilesClient.end();
    }
}

syncSubjects();
