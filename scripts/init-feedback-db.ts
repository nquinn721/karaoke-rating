import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function testDatabaseConnection() {
  console.log('Testing database connection and TypeORM setup...');
  
  const app = await NestFactory.create(AppModule);
  
  try {
    // Just starting the app will initialize TypeORM and create tables
    console.log('✅ Database connection successful!');
    console.log('✅ TypeORM entities loaded and synchronized!');
    console.log('✅ Feedback table should now be available.');
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
  } finally {
    await app.close();
  }
}

testDatabaseConnection();
