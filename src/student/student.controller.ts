import { Controller, Get, Patch, Param, Delete, Query, Body, ParseIntPipe } from '@nestjs/common';
import { StudentService } from './student.service';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationDto } from 'src/pagination/pagination.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Students')
@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @ApiOperation({ summary: 'Get all students' })
  @Get()
  findAll(@Query() findWithPagination: PaginationDto) {
    return this.studentService.findAll(findWithPagination);
  }

  @ApiOperation({ summary: 'Get active students with their careers' })
  @Get('active-with-career')
  findActiveWithCareer() {
    return this.studentService.findActiveWithCareer();
  }

  @ApiOperation({ summary: 'Get enrollment report (Native Query)' })
  @Get('report')
  getReport() {
    return this.studentService.getEnrollmentReport();
  }

  @ApiOperation({ summary: 'Advanced student search' })
  @Get('search-advanced')
  searchAdvanced(
    @Query('careerId', ParseIntPipe) careerId: number,
    @Query('cycleId', ParseIntPipe) cycleId: number,
  ) {
    return this.studentService.searchAdvanced(careerId, cycleId);
  }

  @ApiOperation({ summary: 'Get student enrollments by cycle' })
  @Get(':id/enrollments/:cycleId')
  findEnrollments(
    @Param('id', ParseIntPipe) id: number,
    @Param('cycleId', ParseIntPipe) cycleId: number,
  ) {
    return this.studentService.findEnrollments(id, cycleId);
  }

  @ApiOperation({ summary: 'Get a student by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update a student profile' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(+id, updateStudentDto);
  }

  @ApiOperation({ summary: 'Delete a student' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(+id);
  }
}
