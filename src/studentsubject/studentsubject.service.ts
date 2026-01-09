import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateStudentsubjectDto } from './dto/create-studentsubject.dto';
import { UpdateStudentsubjectDto } from './dto/update-studentsubject.dto';
import { PrismaProfilesService } from 'src/prisma/prisma-profiles.service';
import { PaginationDto } from 'src/pagination/pagination.dto';

@Injectable()
export class StudentsubjectService {
  constructor(private readonly prisma: PrismaProfilesService) { }

  private readonly include = {
    studentProfile: { include: { user: true, career: true } },
    subject: { include: { subjectAssignments: { include: { teacherProfile: true } } } }
  };

  async create(dto: CreateStudentsubjectDto) {
    try {
      return await this.prisma.studentSubject.create({ data: dto, include: this.include });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Student is already enrolled in this subject');
      }
      throw error;
    }
  }

  async findAll({ page = 1, limit = 10 }: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.studentSubject.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: this.include
      }),
      this.prisma.studentSubject.count()
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const item = await this.prisma.studentSubject.findUnique({
      where: { id },
      include: this.include
    });
    if (!item) throw new NotFoundException('Student enrollment not found');
    return item;
  }

  async update(id: number, dto: UpdateStudentsubjectDto) {
    try {
      await this.findOne(id);
      return await this.prisma.studentSubject.update({
        where: { id },
        data: dto,
        include: this.include
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('This student is already enrolled in this subject');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.studentSubject.delete({ where: { id } });
    return { message: `Student Subject relationship with ID ${id} has been successfully removed` };
  }
}
