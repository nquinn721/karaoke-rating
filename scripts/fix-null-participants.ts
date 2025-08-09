import { DataSource } from "typeorm";
import { Rating } from "../src/rating/entities/rating.entity";
import { Show } from "../src/shows/entities/show.entity";
import { User } from "../src/user/entities/user.entity";

async function fixNullParticipants() {
  const dataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || "admin",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_DATABASE || "karaoke",
    entities: [Show, Rating, User],
    synchronize: true,
  });

  try {
    await dataSource.initialize();
    console.log("Database connected");

    const showRepository = dataSource.getRepository(Show);

    // Find shows with null participants or queue
    const shows = await showRepository.find();

    let updatedCount = 0;
    for (const show of shows) {
      let needsUpdate = false;

      if (show.participants === null || show.participants === undefined) {
        show.participants = [];
        needsUpdate = true;
      }

      if (show.queue === null || show.queue === undefined) {
        show.queue = [];
        needsUpdate = true;
      }

      if (needsUpdate) {
        await showRepository.save(show);
        updatedCount++;
        console.log(`Updated show "${show.name}" (ID: ${show.id})`);
      }
    }

    console.log(`Fixed ${updatedCount} shows with null participants/queue`);
  } catch (error) {
    console.error("Error fixing null participants:", error);
  } finally {
    await dataSource.destroy();
  }
}

fixNullParticipants();
