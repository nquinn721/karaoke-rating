import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  forwardRef,
} from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";
import { KarafunQueueData, ParseKarafunUrlDto } from "./karafun.interface";
import { KarafunService } from "./karafun.service";

@Controller("api/karafun")
export class KarafunController {
  constructor(
    private readonly karafunService: KarafunService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway
  ) {}

  @Post("parse")
  async parseQueue(@Body() dto: ParseKarafunUrlDto): Promise<KarafunQueueData> {
    const karafunData = await this.karafunService.parseQueueFromUrl(dto.url);

    // If a showId is provided, broadcast the update to all clients in that show
    if (
      dto.showId &&
      karafunData &&
      (karafunData.singers || karafunData.songEntries)
    ) {
      this.chatGateway.server
        .to(`show_${dto.showId}`)
        .emit("karafunQueueUpdated", {
          showId: parseInt(dto.showId),
          karafunData: karafunData,
        });

      console.log(
        `🎤 Broadcasted Karafun queue update for show ${dto.showId} via direct parse endpoint`
      );
    }

    return karafunData;
  }

  @Get("test")
  async parseTestHtml(): Promise<KarafunQueueData> {
    return this.karafunService.parseTestHtml();
  }
}
