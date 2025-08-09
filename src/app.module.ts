import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ChatModule } from "./chat/chat.module";
import { MusicModule } from "./music/music.module";
import { RatingModule } from "./rating/rating.module";
import { ShowsModule } from "./shows/shows.module";
import { UserModule } from "./user/user.module";
// Entities
import { Rating } from "./rating/entities/rating.entity";
import { Show } from "./shows/entities/show.entity";
import { User } from "./user/entities/user.entity";

@Module({
  imports: [
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
      entities: [User, Show, Rating], // Database entities
      synchronize: true, // Temporarily enabled to create initial tables
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
    MusicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
