import { DataSource } from 'typeorm';
import { Show } from '../src/shows/entities/show.entity';
import { Rating } from '../src/rating/entities/rating.entity';
import { User } from '../src/user/entities/user.entity';

async function addIsAdminColumn() {
  const isProd = process.env.NODE_ENV === 'production';
  const common = {
    type: 'mysql' as const,
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'karaoke',
    entities: [Show, Rating, User],
    synchronize: false,
  };

  const connectionOptions = isProd
    ? {
        ...common,
        socketPath:
          process.env.DB_HOST ||
          '/cloudsql/heroic-footing-460117-k8:us-central1:stocktrader',
      }
    : {
        ...common,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
      };

  console.log('Connecting to MySQL with:', {
    mode: isProd ? 'socketPath' : 'host/port',
    target: isProd ? connectionOptions['socketPath'] : connectionOptions['host'] + ':' + connectionOptions['port'],
    database: connectionOptions.database,
    user: connectionOptions.username,
  });

  const dataSource = new DataSource(connectionOptions as any);

  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Check if column exists
    const rows: any[] = await dataSource.query(
      "SHOW COLUMNS FROM `users` LIKE 'isAdmin'"
    );

    if (!rows || rows.length === 0) {
      console.log('Adding isAdmin column to users table...');
      await dataSource.query(
        'ALTER TABLE `users` ADD COLUMN `isAdmin` TINYINT(1) NOT NULL DEFAULT 0'
      );
      console.log('isAdmin column added.');
    } else {
      console.log('isAdmin column already exists.');
    }

    // Optionally promote a specific user to admin via env var
    const adminUsername = process.env.ADMIN_USERNAME;
    if (adminUsername) {
      console.log(`Promoting user "${adminUsername}" to admin...`);
      const result = await dataSource.query(
        'UPDATE `users` SET `isAdmin` = 1 WHERE `username` = ?',
        [adminUsername]
      );
      console.log('Promotion result:', result);
    }

    console.log('Done.');
  } catch (error) {
    console.error('Error adding isAdmin column:', error);
  } finally {
    await dataSource.destroy();
  }
}

addIsAdminColumn();
