import { HttpModule } from "@nestjs/axios";
import { Module, forwardRef } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { ChatModule } from "../chat/chat.module";
import { UserModule } from "../user/user.module";
import { KarafunController } from "./karafun.controller";
import { KarafunService } from "./karafun.service";

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    UserModule, // Import UserModule to provide UserService for AdminGuard
    forwardRef(() => ChatModule), // Import ChatModule for ChatGateway injection
  ],
  controllers: [KarafunController],
  providers: [KarafunService, AdminGuard], // Provide AdminGuard directly
  exports: [KarafunService], // Export service so other modules can use it
})
export class KarafunModule {}
