import {
	Injectable,
	BadRequestException,
	UnauthorizedException,
	InternalServerErrorException,
	ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { LoginDto } from "./dto/loginDto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { RefreshDto } from "./dto/refreshDto";
import { ConfigService } from "@nestjs/config";
import { PrismaUsersService } from "src/prisma/prisma-users.service";
import { PrismaProfilesService } from "src/prisma/prisma-profiles.service";
import { RegisterStudentDto } from "./dto/register-student.dto";
import { RegisterTeacherDto } from "./dto/register-teacher.dto";

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaUsersService,
		private readonly prismaProfiles: PrismaProfilesService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) { }

	async registerStudent(registerStudentDto: RegisterStudentDto) {
		try {
			// 1. Asegurar que el rol existe (Self-healing)
			await this.prisma.role.upsert({
				where: { id: 3 },
				update: {},
				create: { id: 3, name: 'STUDENT' }
			});

			const hashedPassword = bcrypt.hashSync(registerStudentDto.password, 10);

			// 2. Upsert del usuario en la DB de Users
			const user = await this.prisma.user.upsert({
				where: { email: registerStudentDto.email },
				update: {}, // Si existe, no hacemos nada por ahora
				create: {
					name: registerStudentDto.name,
					email: registerStudentDto.email,
					password: hashedPassword,
					phone: registerStudentDto.phone || null,
					age: registerStudentDto.age || null,
					role: { connect: { id: 3 } }, // 3 = STUDENT
					status: 'active'
				}
			});

			// 3. Crear el registro de sincronización
			await this.prisma.userSync.upsert({
				where: { userId: user.id },
				update: {},
				create: {
					userId: user.id,
					role: { connect: { id: 3 } }, // STUDENT
					hasStudentProfile: true
				}
			});

			// 4. Asegurar que la carrera existe en la DB de Profiles
			await this.prismaProfiles.careerReference.upsert({
				where: { id: registerStudentDto.careerId },
				update: {},
				create: {
					id: registerStudentDto.careerId,
					name: 'Carrera ' + registerStudentDto.careerId,
					totalCicles: 10
				}
			});

			// 5. Upsert de la referencia del usuario y el perfil de estudiante en Profiles
			await this.prismaProfiles.userReference.upsert({
				where: { id: user.id },
				update: {
					name: user.name,
					email: user.email,
					status: user.status
				},
				create: {
					id: user.id,
					name: user.name,
					email: user.email,
					roleId: 3, // STUDENT
					status: user.status,
					studentProfile: {
						create: {
							careerId: registerStudentDto.careerId,
							currentCicle: registerStudentDto.currentCicle,
						}
					}
				}
			});

			// Limpiar respuesta
			const { password, ...userWithoutPassword } = user;
			return userWithoutPassword;
		} catch (error) {
			console.error('Error en registerStudent:', error);
			this.handleDBErrors(error);
		}
	}

	async registerTeacher(registerTeacherDto: RegisterTeacherDto) {
		try {
			// Ensure role exists
			await this.prisma.role.upsert({
				where: { id: 2 },
				update: {},
				create: { id: 2, name: 'TEACHER' }
			});

			const hashedPassword = bcrypt.hashSync(registerTeacherDto.password, 10);

			// Upsert user in Users DB
			const user = await this.prisma.user.upsert({
				where: { email: registerTeacherDto.email },
				update: {},
				create: {
					name: registerTeacherDto.name,
					email: registerTeacherDto.email,
					password: hashedPassword,
					phone: registerTeacherDto.phone || null,
					age: registerTeacherDto.age || null,
					role: { connect: { id: 2 } }, // 2 = TEACHER
					status: 'active'
				}
			});

			// Create UserSync record
			await this.prisma.userSync.upsert({
				where: { userId: user.id },
				update: {},
				create: {
					userId: user.id,
					role: { connect: { id: 2 } }, // TEACHER
					hasTeacherProfile: true
				}
			});

			// Ensure career and speciality references exist
			await this.prismaProfiles.careerReference.upsert({
				where: { id: registerTeacherDto.careerId },
				update: {},
				create: { id: registerTeacherDto.careerId, name: 'Carrera ' + registerTeacherDto.careerId, totalCicles: 10 }
			});

			await this.prismaProfiles.specialityReference.upsert({
				where: { id: registerTeacherDto.specialityId },
				update: {},
				create: { id: registerTeacherDto.specialityId, name: 'Especialidad ' + registerTeacherDto.specialityId }
			});

			// Upsert UserReference and TeacherProfile in profiles DB
			await this.prismaProfiles.userReference.upsert({
				where: { id: user.id },
				update: {
					name: user.name,
					email: user.email,
					status: user.status
				},
				create: {
					id: user.id,
					name: user.name,
					email: user.email,
					roleId: 2, // TEACHER
					status: user.status,
					teacherProfile: {
						create: {
							specialityId: registerTeacherDto.specialityId,
							careerId: registerTeacherDto.careerId,
						}
					}
				}
			});

			// Remove password from response
			const { password, ...userWithoutPassword } = user;
			return userWithoutPassword;
		} catch (error) {
			console.error('Error en registerTeacher:', error);
			this.handleDBErrors(error);
		}
	}

	async login(loginDto: LoginDto) {
		const { password, email } = loginDto;

		const user = await this.prisma.user.findUnique({
			where: { email },
			include: {
				role: true
			}
		});
		if (!user) throw new UnauthorizedException("Credentials are not valid");
		if (!bcrypt.compareSync(password, user.password))
			throw new UnauthorizedException("Credentials are not valid");

		const roleName = user.role.name;

		const accessToken = this.getJwtToken(
			{ id: user.id, role: roleName },
			{ expiresIn: "2d" },
		);
		const refreshToken = this.getJwtToken({ id: user.id }, { expiresIn: "7d" });

		return {
			userId: user.id,
			roleName,
			accessToken,
			refreshToken,
		};
	}

	private getJwtToken(payload: JwtPayload, options?: { expiresIn: string }) {
		const signOptions = {
			secret: this.configService.get<string>("JWT_SECRET"),
			expiresIn: options?.expiresIn || "2d",
		};
		const token = this.jwtService.sign(payload, signOptions as any);
		return token;
	}

	async refreshToken(refreshDto: RefreshDto) {
		try {
			const payload = this.jwtService.verify(refreshDto.refreshToken, {
				secret: this.configService.get<string>("JWT_SECRET"),
			});
			const user = await this.prisma.user.findUnique({
				where: { id: payload.id },
				select: { email: true, password: true, id: true },
			});

			if (!user) throw new UnauthorizedException("Invalid refresh token");
			const accessToken = this.getJwtToken(
				{ id: user.id },
				{ expiresIn: "2d" },
			);
			const refreshToken = this.getJwtToken(
				{ id: user.id },
				{ expiresIn: "7d" },
			);

			return {
				...user,
				accessToken,
				refreshToken,
			};
		} catch (error) {
			throw error;
		}
	}
	private handleDBErrors(error: any): never {
		console.error('--- FULL DATABASE ERROR ---');
		console.error(error);

		if (error.code === "P2002")
			throw new ConflictException(error.detail || "Record already exists");

		throw new InternalServerErrorException(error.message || "Please check server logs");
	}
}
