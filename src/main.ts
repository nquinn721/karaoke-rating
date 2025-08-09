import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://karaoke-rating-203453576607.us-east1.run.app"]
        : "*",
    credentials: true,
  });

  // Serve static files from the React build
  app.useStaticAssets(join(__dirname, "..", "client", "dist"));

  // Set the views directory for serving index.html
  app.setBaseViewsDir(join(__dirname, "..", "client", "dist"));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
