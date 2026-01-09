import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';

@Controller('enrollment')
export class EnrollmentController {
    constructor(private readonly enrollmentService: EnrollmentService) { }

    @Post(':studentId/:subjectId')
    async enroll(
        @Param('studentId', ParseIntPipe) studentId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
    ) {
        return await this.enrollmentService.enrollStudent(studentId, subjectId);
    }
}
