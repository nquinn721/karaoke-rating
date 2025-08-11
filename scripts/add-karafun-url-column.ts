// Migration script to add karafunUrl column to shows table

export class AddKarafunUrlToShows {
  name = "AddKarafunUrlToShows" + Date.now();

  async up(queryRunner: any): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shows" 
      ADD "karafunUrl" character varying(500)
    `);
  }

  async down(queryRunner: any): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shows" 
      DROP COLUMN "karafunUrl"
    `);
  }
}
