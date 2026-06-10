import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('nearby')
  findNearby(@Request() req, @Query('radius') radius?: string) {
    const radiusKm = radius ? parseFloat(radius) : 10;
    return this.discoveryService.findNearby(req.user.id, radiusKm);
  }
}
