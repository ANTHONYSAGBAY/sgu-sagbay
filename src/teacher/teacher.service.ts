import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PrismaProfilesService } from 'src/prisma/prisma-profiles.service';
import { PaginationDto } from 'src/pagination/pagination.dto';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaProfilesService) { }

  private readonly teacherIncludes = {
    speciality: true,
    career: true,
    subjects: true
  }

  async findAll(findWithPagination: PaginationDto) {
    const { page = 1, limit = 10 } = findWithPagination;
    const skip = (page - 1) * limit;

    try {
      const [data, total] = await Promise.all([
        this.prisma.userReference.findMany({
          where: { roleId: 2 }, // 2 = TEACHER
          skip,
          take: limit,
          include: {
            teacherProfile: {
              include: {
                speciality: true,
                career: true,
                subjects: true
              }
            }
          }
        }),
        this.prisma.userReference.count({ where: { roleId: 2 } })
      ]);

      return {
        data,
        total,
        page,
        limit
      };

    } catch (error) {
      throw new InternalServerErrorException('Error fetching teachers');
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.userReference.findUnique({
        where: { id },
        include: {
          teacherProfile: {
            include: {
              speciality: true,
              career: true,
              subjects: true
            }
          }
        }
      });

      if (!user || user.roleId !== 2) {
        throw new NotFoundException('Teacher not found');
      }

      return user;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error fetching teacher');
    }
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto) {
    try {
      const user = await this.prisma.userReference.findUnique({
        where: { id }
      });

      if (!user || user.roleId !== 2) {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }

      // Prepare update data for user (UserReference only has name and email)
      const userUpdateData = {
        ...(updateTeacherDto.name && { name: updateTeacherDto.name }),
        ...(updateTeacherDto.email && { email: updateTeacherDto.email }),
      };

      // Prepare update data for teacher profile
      const profileUpdateData = {
        ...(updateTeacherDto.specialityId && { specialityId: updateTeacherDto.specialityId }),
        ...(updateTeacherDto.careerId && { careerId: updateTeacherDto.careerId }),
      };

      // Update user and profile
      return await this.prisma.userReference.update({
        where: { id },
        data: {
          ...userUpdateData,
          ...(Object.keys(profileUpdateData).length > 0 && {
            teacherProfile: {
              update: profileUpdateData
            }
          })
        },
        include: {
          teacherProfile: {
            include: {
              speciality: true,
              career: true,
              subjects: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException('Error updating teacher');
    }
  }

  // Esta es la consulta de la Parte 1: Listar los docentes que imparten más de una asignatura
  async findBusyTeachers() {
    try {
      // Listar docentes que imparten más de una asignatura
      return await this.prisma.teacherProfile.findMany({
        where: {
          subjects: {
            some: {} // At least one
          }
        },
        include: {
          user: true,
          _count: {
            select: { subjects: true }
          }
        }
      }).then(teachers => teachers.filter(t => t._count.subjects > 1));
    } catch (error) {
      throw new InternalServerErrorException('Error fetching busy teachers');
    }
  }

  // Esta es la consulta de la Parte 2: Filtrar docentes por tiempo completo y otras condiciones lógicas
  async filterAdvanced() {
    try {
      // Docentes: Tiempo completo AND (Dictan asignaturas OR NOT Inactivos)
      return await this.prisma.teacherProfile.findMany({
        where: {
          AND: [
            { type: 'FULL_TIME' },
            {
              OR: [
                { subjects: { some: {} } },
                { NOT: { user: { status: 'inactive' } } }
              ]
            }
          ]
        },
        include: {
          user: true,
          subjects: {
            include: {
              subject: true
            }
          }
        }
      });
    } catch (error) {
      throw new InternalServerErrorException('Error in advanced teacher filter');
    }
  }

  async remove(id: number) {
    try {
      const user = await this.prisma.userReference.findUnique({
        where: { id }
      });

      if (!user || user.roleId !== 2) {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }

      // Delete will cascade to teacherProfile due to the schema configuration
      await this.prisma.userReference.delete({
        where: { id }
      });

      return { message: `Teacher with ID ${id} has been successfully removed` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error removing teacher');
    }
  }
}
