import { Module, forwardRef } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { FeedbackModule } from "../feedback/feedback.module";

@Module({
  imports: [forwardRef(() => FeedbackModule)],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
