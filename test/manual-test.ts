
// Using fetch API
// If axios is not installed, I'll use fetch.
// Since I don't know if axios is installed (package.json didn't allow me to check dependencies thoroughly/I missed it?), I'll use fetch.
// Actually package.json showed dependencies, let me check history.
// dependencies: ... "dotenv", "pg", "prisma", "reflect-metadata" ... NO AXIOS.
// So I MUST use fetch.

async function test() {
    const baseUrl = 'http://localhost:3000';

    console.log('--- Starting Test ---');

    // 1. Register Student
    const studentData = {
        name: "Test Student",
        email: `teststudent_${Date.now()}@example.com`,
        password: "password123",
        role: "STUDENT", // Usually inferred by endpoint
        careerId: 1, // Assumptions based on seeds likely creating career 1
        currentCicle: 1,
        // age, phone optional
    };

    console.log(`\n1. Registering Student: ${studentData.email}`);
    try {
        const regRes = await fetch(`${baseUrl}/auth/register/student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });

        if (!regRes.ok) {
            console.error('Register Student Failed:', regRes.status, await regRes.text());
        } else {
            console.log('Register Student OK:', await regRes.json());
        }
    } catch (e) {
        console.error('Register Student Error:', e.message);
    }

    // 2. Login Student
    console.log(`\n2. Logging in Student`);
    let studentToken = '';
    let studentId = 0;
    try {
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: studentData.email, password: studentData.password })
        });

        if (!loginRes.ok) {
            console.error('Login Failed:', loginRes.status, await loginRes.text());
        } else {
            const data = await loginRes.json();
            console.log('Login OK');
            studentToken = data.accessToken;
            studentId = data.userId;
            console.log('Token received. UserID:', studentId);
        }
    } catch (e) {
        console.error('Login Error:', e.message);
    }

    // 3. Get Student Profile
    if (studentToken && studentId) {
        console.log(`\n3. Getting Student Profile for ID: ${studentId}`);
        try {
            const profileRes = await fetch(`${baseUrl}/student/${studentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${studentToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!profileRes.ok) {
                console.error('Get Profile Failed:', profileRes.status, await profileRes.text());
            } else {
                console.log('Get Profile OK:', await profileRes.json());
            }
        } catch (e) {
            console.error('Get Profile Error:', e.message);
        }
    }

    // 4. Register Teacher
    const teacherData = {
        name: "Test Teacher",
        email: `testteacher_${Date.now()}@example.com`,
        password: "password123",
        specialityId: 1, // Assumptions
        careerId: 1
    };

    console.log(`\n4. Registering Teacher: ${teacherData.email}`);
    try {
        const regRes = await fetch(`${baseUrl}/auth/register/teacher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teacherData)
        });

        if (!regRes.ok) {
            console.error('Register Teacher Failed:', regRes.status, await regRes.text());
        } else {
            console.log('Register Teacher OK:', await regRes.json());
        }
    } catch (e) {
        console.error('Register Teacher Error:', e.message);
    }

    // 5. Login Teacher
    console.log(`\n5. Logging in Teacher`);
    let teacherToken = '';
    let teacherId = 0;
    try {
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: teacherData.email, password: teacherData.password })
        });

        if (!loginRes.ok) {
            console.error('Login Failed:', loginRes.status, await loginRes.text());
        } else {
            const data = await loginRes.json();
            console.log('Login OK');
            teacherToken = data.accessToken;
            teacherId = data.userId;
            console.log('Token received. UserID:', teacherId);
        }
    } catch (e) {
        console.error('Login Error:', e.message);
    }

    // 6. Get Teacher Profile assuming endpoint /teacher/:id (Need to verify TeacherController but assuming standard)
    if (teacherToken && teacherId) {
        console.log(`\n6. Getting Teacher Profile for ID: ${teacherId}`);
        try {
            const profileRes = await fetch(`${baseUrl}/teacher/${teacherId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${teacherToken}`, // Usually Bearer is required
                    'Content-Type': 'application/json'
                }
            });

            if (!profileRes.ok) {
                // Might handle auth differently?
                // NestJS Guards usually check bearer.
                console.error('Get Teacher Profile Failed:', profileRes.status, await profileRes.text());
            } else {
                console.log('Get Teacher Profile OK:', await profileRes.json());
            }
        } catch (e) {
            console.error('Get Teacher Profile Error:', e.message);
        }
    }


    console.log('\n--- Test Finished ---');
}

test();
