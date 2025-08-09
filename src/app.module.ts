import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ChatModule } from "./chat/chat.module";
import { Feedback } from "./feedback/entities/feedback.entity";
import { FeedbackModule } from "./feedback/feedback.module";
import { MusicModule } from "./music/music.module";
import { ShowsModule } from "./shows/shows.module";

@Module({
  imports: [
    // Database configuration
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DB_HOST || "localhost",
      port: 3306,
      username: process.env.NODE_ENV === "production" ? "karaoke" : "admin",
      password:
        process.env.NODE_ENV === "production"
          ? 'GC(*g""\\9SH@{vBr'
          : "password",
      database: "karaoke",
      entities: [Feedback],
      synchronize: process.env.NODE_ENV !== "production", // Only sync in development
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    }),
    // Only serve static files in production
    ...(process.env.NODE_ENV === "production"
      ? [
          ServeStaticModule.forRoot({
            rootPath: join(__dirname, "..", "client", "dist"),
            exclude: ["/api/*"],
          }),
        ]
      : []),
    ShowsModule,
    ChatModule,
    FeedbackModule,
    MusicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
