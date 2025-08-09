import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { FeedbackService } from '../src/feedback/feedback.service';

async function initializeDatabase() {
  const app = await NestFactory.create(AppModule);
  const feedbackService = app.get(FeedbackService);
  
  try {
    console.log('Initializing feedback database table...');
    await feedbackService.initializeDatabase();
    console.log('Database table created successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await app.close();
  }
}

initializeDatabase();
