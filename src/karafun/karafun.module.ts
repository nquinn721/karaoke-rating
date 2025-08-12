import { HttpModule } from "@nestjs/axios";
import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminGuard } from "../auth/admin.guard";
import { ChatModule } from "../chat/chat.module";
import { UserModule } from "../user/user.module";
import { KarafunController } from "./karafun.controller";
import { KarafunService } from "./karafun.service";
import { KarafunSessionManager } from "./session-manager.service";
import { KarafunSession } from "./entities/karafun-session.entity";

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    UserModule, // Import UserModule to provide UserService for AdminGuard
    forwardRef(() => ChatModule), // Import ChatModule for ChatGateway injection
    TypeOrmModule.forFeature([KarafunSession]),
  ],
  controllers: [KarafunController],
  providers: [KarafunService, KarafunSessionManager, AdminGuard], // Provide AdminGuard directly
  exports: [KarafunService, KarafunSessionManager, TypeOrmModule], // Export service and session manager
})
export class KarafunModule {}
