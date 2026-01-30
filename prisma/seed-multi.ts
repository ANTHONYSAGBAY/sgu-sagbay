import { PrismaClient as PrismaUsersClient } from '../node_modules/@prisma/client-users';
import { PrismaClient as PrismaAcademicClient } from '../node_modules/@prisma/client-academic';
import { PrismaClient as PrismaProfilesClient } from '../node_modules/@prisma/client-profiles';

const prismaUsers = new PrismaUsersClient();
const prismaAcademic = new PrismaAcademicClient();
const prismaProfiles = new PrismaProfilesClient();

async function main() {
    console.log('Seeding databases...');

    // 1. Roles (Users DB)
    const adminRole = await prismaUsers.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
    const teacherRole = await prismaUsers.role.upsert({ where: { name: 'TEACHER' }, update: {}, create: { name: 'TEACHER' } });
    const studentRole = await prismaUsers.role.upsert({ where: { name: 'STUDENT' }, update: {}, create: { name: 'STUDENT' } });
    console.log('Roles seeded.');

    // 2. Academic Data (Academic DB)
    const cycle = await prismaAcademic.cycle.upsert({
        where: { year_period: { year: 2025, period: 1 } },
        update: {},
        create: {
            name: '2025-1',
            year: 2025,
            period: 1,
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-06-30'),
            isActive: true
        }
    });

    const career = await prismaAcademic.career.upsert({
        where: { name: 'Ingeniería de Sistemas' },
        update: {},
        create: {
            name: 'Ingeniería de Sistemas',
            totalCicles: 10,
            durationYears: 5
        }
    });

    const speciality = await prismaAcademic.speciality.upsert({
        where: { name: 'Sistemas Dinámicos' },
        update: {},
        create: {
            name: 'Sistemas Dinámicos',
            description: 'Especialidad en sistemas'
        }
    });

    const subject = await prismaAcademic.subject.upsert({
        where: { careerId_cicleNumber_name: { careerId: career.id, cicleNumber: 1, name: 'Programación I' } },
        update: {},
        create: {
            name: 'Programación I',
            careerId: career.id,
            cicleNumber: 1,
            cycleId: cycle.id
        }
    });
    console.log('Academic data seeded.');

    // 3. Sync References (Profiles DB)
    await prismaProfiles.careerReference.upsert({
        where: { id: career.id },
        update: {},
        create: { id: career.id, name: career.name, totalCicles: career.totalCicles }
    });

    await prismaProfiles.specialityReference.upsert({
        where: { id: speciality.id },
        update: {},
        create: { id: speciality.id, name: speciality.name }
    });

    await prismaProfiles.subjectReference.upsert({
        where: { id: subject.id },
        update: {},
        create: { id: subject.id, name: subject.name, careerId: career.id, cicleNumber: subject.cicleNumber, capacity: 30 }
    });
    console.log('Profile references synced.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prismaUsers.$disconnect();
        await prismaAcademic.$disconnect();
        await prismaProfiles.$disconnect();
    });
