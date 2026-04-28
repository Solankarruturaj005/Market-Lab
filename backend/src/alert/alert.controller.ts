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
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateAlertDto } from './dto/create-alert.dto';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  async getAlerts(@Request() req) {
    return this.alertService.getAlerts(req.user.id);
  }

  @Post()
  async createAlert(@Request() req, @Body() body: CreateAlertDto) {
    return this.alertService.createAlert(req.user.id, body);
  }

  @Delete(':id')
  async deleteAlert(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.alertService.deleteAlert(req.user.id, id);
  }
}
