import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { Rating } from "../rating/entities/rating.entity";
import { Show } from "../shows/entities/show.entity";
import { UserSession } from "./entities/user-session.entity";
import { User } from "./entities/user.entity";
import { SessionService } from "./session.service";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession, Rating, Show]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, SessionService],
  exports: [UserService, SessionService, TypeOrmModule],
})
export class UserModule {}
