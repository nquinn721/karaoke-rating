import { Module, forwardRef } from "@nestjs/common";
import { FeedbackModule } from "../feedback/feedback.module";
import { ChatGateway } from "./chat.gateway";

@Module({
  imports: [forwardRef(() => FeedbackModule)],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
