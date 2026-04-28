import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AiService, AnalyzeStockInput, ChatMessage, NewsItem } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

class AnalyzeStockDto implements AnalyzeStockInput {
  symbol: string;
  price?: number | null;
  change?: number | null;
  rsi?: number | null;
  macd?: number | null;
  sma20?: number | null;
  ema20?: number | null;
}

class ChatDto {
  messages: ChatMessage[];
}

class SummarizeNewsDto {
  symbol: string;
  news: NewsItem[];
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /ai/analyze-stock
   * Accepts stock data (price, RSI, MACD…) and returns AI summary + Buy/Sell/Hold signal
   */
  @Post('analyze-stock')
  analyzeStock(@Body() body: AnalyzeStockDto) {
    return this.aiService.analyzeStock(body);
  }

  /**
   * POST /ai/chat
   * Accepts a messages array and returns a chat reply from MarketBot
   */
  @Post('chat')
  chat(@Body() body: ChatDto) {
    return this.aiService.chat(body.messages ?? []);
  }

  /**
   * POST /ai/summarize-news
   * Accepts a stock symbol and array of news articles, returns AI summary + sentiment
   */
  @Post('summarize-news')
  summarizeNews(@Body() body: SummarizeNewsDto, @Request() _req) {
    return this.aiService.summarizeNews(body.symbol, body.news ?? []);
  }
}
