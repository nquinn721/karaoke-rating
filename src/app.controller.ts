import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("api/health")
  health(): string {
    return "API is running";
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Catch-all route for SPA - this should come LAST to avoid intercepting API routes
  // @Get('*')
  // catchAll(@Res() res: Response) {
  //   // Only serve index.html for non-API routes
  //   const url = res.req.url;
  //   if (url && url.startsWith('/api/')) {
  //     // Let other controllers handle API routes
  //     return res.status(404).json({ message: 'API endpoint not found' });
  //   }
  //
  //   // For all other routes, serve the React app
  //   res.sendFile(join(__dirname, '..', 'client', 'dist', 'index.html'));
  // }
}
