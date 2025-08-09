import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FeedbackModule } from "../feedback/feedback.module";
import { ShowsModule } from "../shows/shows.module";
import { User } from "../user/entities/user.entity";
import { ChatGateway } from "./chat.gateway";

@Module({
  imports: [
    forwardRef(() => FeedbackModule),
    forwardRef(() => ShowsModule),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
