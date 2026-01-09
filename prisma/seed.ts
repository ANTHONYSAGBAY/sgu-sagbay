import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seed started...');

    // 1. Roles
    const adminRole = await prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN' },
    });

    const teacherRole = await prisma.role.upsert({
        where: { name: 'TEACHER' },
        update: {},
        create: { name: 'TEACHER' },
    });

    const studentRole = await prisma.role.upsert({
        where: { name: 'STUDENT' },
        update: {},
        create: { name: 'STUDENT' },
    });

    console.log('Roles created or already exist.');

    // 2. Users (Admin)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@sgu.com' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@sgu.com',
            password: hashedPassword,
            roleId: adminRole.id,
            status: 'active',
        },
    });

    console.log('Admin user created.');

    // 3. Careers
    const career = await prisma.career.upsert({
        where: { name: 'Ingeniería de Sistemas' },
        update: {},
        create: {
            name: 'Ingeniería de Sistemas',
            totalCicles: 10,
            durationYears: 5,
        },
    });

    console.log('Careers created.');

    // 4. Specialities
    const speciality = await prisma.speciality.upsert({
        where: { name: 'Desarrollo de Software' },
        update: {},
        create: {
            name: 'Desarrollo de Software',
            description: 'Especialidad enfocada en la construcción de aplicaciones.',
        },
    });

    console.log('Specialities created.');

    // 5. Cycles
    const cycle = await prisma.cycle.upsert({
        where: { year_period: { year: 2025, period: 1 } },
        update: {},
        create: {
            name: '2025-1',
            year: 2025,
            period: 1,
            startDate: new Date('2025-03-01'),
            endDate: new Date('2025-07-15'),
            isActive: true,
        },
    });

    console.log('Academic cycles created.');

    // 6. Subjects
    const subject1 = await prisma.subject.upsert({
        where: { careerId_cicleNumber_name: { careerId: career.id, cicleNumber: 1, name: 'Introducción a la Programación' } },
        update: {},
        create: {
            name: 'Introducción a la Programación',
            careerId: career.id,
            cicleNumber: 1,
            cycleId: cycle.id,
        },
    });

    console.log('Subjects created.');

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
