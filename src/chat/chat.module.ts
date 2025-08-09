import { Module, forwardRef } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
// import { FeedbackModule } from "../feedback/feedback.module"; // Temporarily disabled

@Module({
  imports: [/* forwardRef(() => FeedbackModule) */], // Temporarily disabled
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
