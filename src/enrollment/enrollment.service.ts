import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaProfilesService } from 'src/prisma/prisma-profiles.service';

@Injectable()
export class EnrollmentService {
    constructor(private readonly prisma: PrismaProfilesService) { }

    // Esta es la consulta de la Parte 4: Proceso de matriculación bajo transacción (ACID)
    async enrollStudent(studentId: number, subjectId: number) {
        return await this.prisma.$transaction(async (tx) => {
            // 1. Verificar que el estudiante esté activo
            const user = await tx.userReference.findUnique({
                where: { id: studentId },
                include: { studentProfile: true },
            });

            if (!user || user.status !== 'active' || !user.studentProfile) {
                throw new BadRequestException('El estudiante no existe o no está activo');
            }

            // 2. Verificar disponibilidad de cupos en la asignatura
            const subject = await tx.subjectReference.findUnique({
                where: { id: subjectId },
            });

            if (!subject) {
                throw new NotFoundException('La asignatura no existe');
            }

            if (subject.capacity <= 0) {
                throw new BadRequestException('No hay cupos disponibles en esta asignatura');
            }

            // 3. Registrar la matrícula
            const enrollment = await tx.studentSubject.create({
                data: {
                    studentProfileId: user.studentProfile.id,
                    subjectId: subject.id,
                    status: 'enrolled',
                },
            });

            // 4. Descontar el cupo disponible
            await tx.subjectReference.update({
                where: { id: subject.id },
                data: {
                    capacity: subject.capacity - 1,
                },
            });

            return enrollment;
        }).catch((error) => {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error en el proceso de matriculación: ' + error.message);
        });
    }
}
