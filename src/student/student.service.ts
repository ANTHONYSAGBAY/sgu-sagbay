import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaProfilesService } from 'src/prisma/prisma-profiles.service';
import { PaginationDto } from 'src/pagination/pagination.dto';

@Injectable()
export class StudentService {

  constructor(private readonly prisma: PrismaProfilesService) { }

  async findAll(findWithPagination: PaginationDto) {
    const { page = 1, limit = 10 } = findWithPagination;
    const skip = (page - 1) * limit;

    try {
      const [data, total] = await Promise.all([
        this.prisma.user.findMany({
          where: { roleId: 3 }, // 3 = STUDENT
          skip,
          take: limit,
          include: {
            studentProfile: {
              include: {
                career: true,
                studentSubjects: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        }),
        this.prisma.user.count({ where: { roleId: 3 } })
      ]);

      return {
        data,
        total,
        page,
        limit
      };

    } catch (error) {
      throw new InternalServerErrorException('Error fetching students');
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          studentProfile: {
            include: {
              career: true,
              studentSubjects: {
                include: {
                  subject: true
                }
              }
            }
          }
        }
      });

      if (!user || user.roleId !== 3) {
        throw new NotFoundException('Student not found');
      }

      return user;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error fetching student');
    }
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!user || user.roleId !== 3) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      // Prepare update data for user (UserReference only has name, email, status)
      const userUpdateData = {
        ...(updateStudentDto.name && { name: updateStudentDto.name }),
        ...(updateStudentDto.email && { email: updateStudentDto.email }),
        ...(updateStudentDto.status && { status: updateStudentDto.status }),
      };

      // Prepare update data for student profile
      const profileUpdateData = {
        ...(updateStudentDto.careerId && { careerId: updateStudentDto.careerId }),
        ...(updateStudentDto.currentCicle && { currentCicle: updateStudentDto.currentCicle }),
      };

      // Update user and profile
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...userUpdateData,
          ...(Object.keys(profileUpdateData).length > 0 && {
            studentProfile: {
              update: profileUpdateData
            }
          })
        },
        include: {
          studentProfile: {
            include: {
              career: true,
              studentSubjects: {
                include: {
                  subject: true
                }
              }
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
      throw new InternalServerErrorException('Error updating student');
    }
  }

  async findActiveWithCareer() {
    try {
      return await this.prisma.user.findMany({
        where: {
          roleId: 3, // STUDENT
          status: 'active'
        },
        include: {
          studentProfile: {
            include: {
              career: true
            }
          }
        }
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching active students with career');
    }
  }

  async findEnrollments(studentId: number, cycleId: number) {
    try {
      return await this.prisma.studentSubject.findMany({
        where: {
          studentProfile: {
            userId: studentId
          },
          subject: {
            cycleId: cycleId
          }
        },
        include: {
          subject: true
        }
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching student enrollments');
    }
  }

  async getEnrollmentReport() {
    try {
      // Consulta SQL nativa: Nombre Estudiante, Carrera, Total Materias
      return await this.prisma.$queryRaw`
        SELECT 
          u.name as student_name,
          c.name as career_name,
          COUNT(ss.id) as total_subjects
        FROM "user" u
        JOIN student_profile sp ON u.id = sp.user_id
        JOIN career c ON sp.career_id = c.id
        LEFT JOIN student_subject ss ON sp.id = ss.student_profile_id
        GROUP BY u.name, c.name
        ORDER BY total_subjects DESC
      `;
    } catch (error) {
      throw new InternalServerErrorException('Error generating enrollment report');
    }
  }

  async searchAdvanced(careerId: number, cycleId: number) {
    try {
      // Búsqueda compleja: Estudiantes Activos AND Carrera AND Período
      return await this.prisma.studentProfile.findMany({
        where: {
          AND: [
            { user: { status: 'active' } },
            { careerId: careerId },
            {
              studentSubjects: {
                some: {
                  subject: {
                    cycleId: cycleId
                  }
                }
              }
            }
          ]
        },
        include: {
          user: true,
          career: true,
          studentSubjects: {
            where: {
              subject: {
                cycleId: cycleId
              }
            },
            include: {
              subject: true
            }
          }
        }
      });
    } catch (error) {
      throw new InternalServerErrorException('Error in advanced student search');
    }
  }

  async remove(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!user || user.roleId !== 3) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      // Delete will cascade to studentProfile due to the schema configuration
      await this.prisma.user.delete({
        where: { id }
      });

      return { message: `Student with ID ${id} has been successfully removed` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error removing student');
    }
  }

}

