import { DataSource } from "typeorm";

const dataSource = new DataSource({
  type: "sqlite",
  database: "karaoke.db",
  synchronize: false,
});

async function addTotalAttendeesColumn() {
  await dataSource.initialize();

  try {
    const queryRunner = dataSource.createQueryRunner();

    // Check if column already exists by trying to select from it
    try {
      await queryRunner.query(`SELECT totalAttendees FROM shows LIMIT 1`);
      console.log("totalAttendees column already exists");
    } catch (error) {
      // Column doesn't exist, so add it
      console.log("Adding totalAttendees column to shows table...");
      await queryRunner.query(`
        ALTER TABLE shows ADD COLUMN totalAttendees TEXT DEFAULT '[]'
      `);

      // Initialize totalAttendees with empty array for existing shows
      await queryRunner.query(`
        UPDATE shows SET totalAttendees = '[]' WHERE totalAttendees IS NULL
      `);

      console.log("totalAttendees column added successfully");
    }

    await queryRunner.release();
  } catch (error) {
    console.error("Error adding totalAttendees column:", error);
  } finally {
    await dataSource.destroy();
  }
}

addTotalAttendeesColumn();
