import { DataSource } from "typeorm";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";

async function addKarafunCacheColumns() {
  const config: MysqlConnectionOptions = {
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "karaoke_ratings",
  };

  const dataSource = new DataSource(config);

  try {
    await dataSource.initialize();

    console.log("Adding Karafun cache columns...");

    // Add karafunCurrentSinger column
    await dataSource.query(`
      ALTER TABLE shows 
      ADD COLUMN IF NOT EXISTS karafunCurrentSinger VARCHAR(255) NULL;
    `);

    // Add karafunCachedData column for JSON cache
    await dataSource.query(`
      ALTER TABLE shows 
      ADD COLUMN IF NOT EXISTS karafunCachedData JSON NULL;
    `);

    // Add karafunLastParsed timestamp column
    await dataSource.query(`
      ALTER TABLE shows 
      ADD COLUMN IF NOT EXISTS karafunLastParsed DATETIME NULL;
    `);

    console.log("✅ Karafun cache columns added successfully!");
  } catch (error) {
    console.error("❌ Error adding columns:", error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  addKarafunCacheColumns()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export default addKarafunCacheColumns;
