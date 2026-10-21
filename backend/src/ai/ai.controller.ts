import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AiService, AnalyzeStockInput, ChatMessage, NewsItem } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

export class ChatMessageDto implements ChatMessage {
  @IsString()
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;
}

export class NewsItemDto implements NewsItem {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;
}

export class AnalyzeStockDto implements AnalyzeStockInput {
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  symbol!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsNumber()
  change?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rsi?: number | null;

  @IsOptional()
  @IsNumber()
  macd?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sma20?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ema20?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number | null;
}

export class ChatDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];
}

export class SummarizeNewsDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  symbol!: string;

  @IsArray()
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => NewsItemDto)
  news!: NewsItemDto[];
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
    console.log('AI INPUT BODY:', body); // DEBUG
    return this.aiService.analyzeStock(body);
  }

  /**
   * POST /ai/chat
   * Accepts a messages array and returns a chat reply from MarketBot
   */
  @Post('chat')
  chat(@Body() body: ChatDto) {
    console.log('AI CHAT HIT'); // ADDED DEBUG
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
