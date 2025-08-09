import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ChatModule } from "./chat/chat.module";
import { ShowsModule } from "./shows/shows.module";

@Module({
  imports: [
    // Only serve static files in production
    ...(process.env.NODE_ENV === "production"
      ? [
          ServeStaticModule.forRoot({
            rootPath: join(__dirname, "..", "client", "dist"),
            exclude: ["/api*"],
          }),
        ]
      : []),
    ShowsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
