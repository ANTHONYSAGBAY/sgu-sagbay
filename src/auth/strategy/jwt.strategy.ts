import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { PrismaUsersService } from "src/prisma/prisma-users.service";
import { User } from "@prisma/client-users";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private prisma: PrismaUsersService,
		configService: ConfigService,
	) {
		super({
			secretOrKey: configService.get("JWT_SECRET"),
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		});
	}

	async validate(payload: JwtPayload): Promise<User> {
		const { id } = payload;

		const user = await this.prisma.user.findUnique({
			where: { id: id },
			include: { role: true }
		});

		if (!user) throw new UnauthorizedException("Token not valid");

		return user;
	}
}
