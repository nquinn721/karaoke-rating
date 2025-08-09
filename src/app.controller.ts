import { Controller, Get, Res } from "@nestjs/common";
import { Response } from 'express';
import { join } from 'path';
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('api/health')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get()
  root(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'client', 'dist', 'index.html'));
  }

  @Get('*')
  catchAll(@Res() res: Response) {
    // Don't serve index.html for API routes
    if (res.req.url.startsWith('/api') || res.req.url.startsWith('/socket.io')) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    
    // Serve index.html for all other routes (React routing)
    res.sendFile(join(__dirname, '..', 'client', 'dist', 'index.html'));
  }
}
