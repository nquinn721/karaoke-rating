import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { KarafunModule } from "./karafun/karafun.module";
import { MusicModule } from "./music/music.module";
import { RatingModule } from "./rating/rating.module";
import { SchedulerModule } from "./scheduler/scheduler.module";
import { ShowsModule } from "./shows/shows.module";
import { UserModule } from "./user/user.module";
// Entities
import { Feedback } from "./feedback/entities/feedback.entity";
import { Rating } from "./rating/entities/rating.entity";
import { Show } from "./shows/entities/show.entity";
import { User } from "./user/entities/user.entity";

@Module({
  imports: [
    // Configure the scheduler module
    ScheduleModule.forRoot(),
    // Database configuration - updated user permissions
    TypeOrmModule.forRoot({
      type: "mysql",
      ...(process.env.NODE_ENV === "production"
        ? {
            // Use Unix socket for Cloud SQL in production
            socketPath:
              process.env.DB_HOST ||
              "/cloudsql/heroic-footing-460117-k8:us-central1:stocktrader",
          }
        : {
            // Use host/port for local development
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT) || 3306,
          }),
      username: process.env.DB_USERNAME || "admin",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_DATABASE || "karaoke",
      entities: [User, Show, Rating, Feedback], // Database entities
      synchronize: true, // Enable sync for production to create tables
      ssl: process.env.NODE_ENV === "production" ? false : false, // No SSL needed for Unix socket
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
    UserModule,
    RatingModule,
    AuthModule,
    FeedbackModule,
    MusicModule,
    KarafunModule,
    SchedulerModule, // Add scheduler module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
