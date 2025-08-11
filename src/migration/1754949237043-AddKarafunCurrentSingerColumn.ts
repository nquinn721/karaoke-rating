import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKarafunCurrentSingerColumn1754949237043
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "shows" 
            ADD COLUMN "karafunCurrentSinger" character varying(100)
        `);
    await queryRunner.query(`
            ALTER TABLE "shows" 
            ADD COLUMN "karafunCachedData" json
        `);
    await queryRunner.query(`
            ALTER TABLE "shows" 
            ADD COLUMN "karafunLastParsed" datetime
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "shows" 
            DROP COLUMN "karafunCurrentSinger"
        `);
    await queryRunner.query(`
            ALTER TABLE "shows" 
            DROP COLUMN "karafunCachedData"
        `);
    await queryRunner.query(`
            ALTER TABLE "shows" 
            DROP COLUMN "karafunLastParsed"
        `);
  }
}
