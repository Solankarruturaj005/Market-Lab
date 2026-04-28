import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WatchlistStockDto } from './dto/watchlist-stock.dto';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  async getWatchlist(@Request() req) {
    console.log(`[WatchlistController] GET /watchlist for user ${req.user.id}`);
    return this.watchlistService.getWatchlist(req.user.id);
  }

  @Post()
  async addToWatchlist(@Request() req, @Body() body: WatchlistStockDto) {
    console.log(
      `[WatchlistController] POST /watchlist for user ${req.user.id} and stock ${body.stockId}`,
    );
    return this.watchlistService.addToWatchlist(req.user.id, body.stockId);
  }

  @Delete(':id')
  async removeFromWatchlist(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    console.log(`[WatchlistController] DELETE /watchlist/${id} for user ${req.user.id}`);
    return this.watchlistService.removeFromWatchlist(req.user.id, id);
  }
}
