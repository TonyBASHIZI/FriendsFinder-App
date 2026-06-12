import { Controller, Post, Patch, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  sendRequest(@Request() req, @Body() body: { receiverId: string }) {
    return this.friendsService.sendRequest(req.user.id, body.receiverId);
  }

  @Patch('request/:id/accept')
  accept(@Request() req, @Param('id') id: string) {
    return this.friendsService.respond(req.user.id, id, true);
  }

  @Patch('request/:id/decline')
  decline(@Request() req, @Param('id') id: string) {
    return this.friendsService.respond(req.user.id, id, false);
  }

  @Get('pending')
  getPending(@Request() req) {
    return this.friendsService.getPending(req.user.id);
  }

  @Get()
  getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.id);
  }
}
