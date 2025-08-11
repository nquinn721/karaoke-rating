import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { Rating } from "../rating/entities/rating.entity";
import { Show } from "../shows/entities/show.entity";
import { User } from "./entities/user.entity";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, Rating, Show]), AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
