import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { PrismaAcademicService } from 'src/prisma/prisma-academic.service';
import { PaginationDto } from 'src/pagination/pagination.dto';

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaAcademicService) { }

  private readonly subjectIncludes = {
    career: true
  }

  async create(createSubjectDto: CreateSubjectDto) {
    try {
      return await this.prisma.subject.create({
        data: createSubjectDto,
        include: this.subjectIncludes
      });

    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Subject already exists');
      }
      throw new InternalServerErrorException('Error creating subject');
    }
  }

  async findAll(findWithPagination: PaginationDto) {
    const { page = 1, limit = 10 } = findWithPagination;
    const skip = (page - 1) * limit;

    try {
      const [data, total] = await Promise.all([
        this.prisma.subject.findMany({
          skip,
          take: limit,
          include: this.subjectIncludes
        }),
        this.prisma.subject.count()
      ]);

      return {
        data,
        total,
        page,
        limit
      };

    } catch (error) {
      throw new InternalServerErrorException('Error fetching subjects');
    }
  }

  async findOne(id: number) {
    try {
      const subject = await this.prisma.subject.findUnique({
        where: { id },
        include: this.subjectIncludes
      });

      if (!subject) {
        throw new NotFoundException('Subject not found');
      }

      return subject;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error fetching subject');
    }
  }

  async update(id: number, updateSubjectDto: UpdateSubjectDto) {
    try {
      const existingSubject = await this.prisma.subject.findUnique({
        where: { id }
      });

      if (!existingSubject) {
        throw new NotFoundException(`Subject with ID ${id} not found`);
      }

      return await this.prisma.subject.update({
        where: { id },
        data: updateSubjectDto,
        include: this.subjectIncludes
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Subject conflict');
      }
      throw new InternalServerErrorException('Error updating subject');
    }
  }

  // Esta es la consulta de la Parte 1: Obtener las materias asociadas a una carrera específica
  async findByCareer(careerId: number) {
    try {
      return await this.prisma.subject.findMany({
        where: { careerId },
        include: this.subjectIncludes
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching subjects by career');
    }
  }

  async remove(id: number) {
    try {
      const existingSubject = await this.prisma.subject.findUnique({
        where: { id }
      });

      if (!existingSubject) {
        throw new NotFoundException(`Subject with ID ${id} not found`);
      }

      await this.prisma.subject.delete({
        where: { id }
      });

      return { message: `Subject with ID ${id} has been successfully removed` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error removing subject');
    }
  }
}
