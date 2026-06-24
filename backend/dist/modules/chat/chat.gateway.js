"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const chat_service_1 = require("./chat.service");
let ChatGateway = class ChatGateway {
    chatService;
    jwtService;
    server;
    onlineUsers = new Map();
    activeCalls = new Map();
    constructor(chatService, jwtService) {
        this.chatService = chatService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token;
            const payload = this.jwtService.verify(token);
            client.data.userId = payload.sub;
            this.onlineUsers.set(payload.sub, client.id);
            this.server.emit('user_online', { userId: payload.sub });
            const onlineList = Array.from(this.onlineUsers.keys());
            client.emit('online_users', onlineList);
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = client.data.userId;
        if (userId) {
            this.onlineUsers.delete(userId);
            this.server.emit('user_offline', { userId });
        }
    }
    async joinConversation(client, data) {
        client.join(data.conversationId);
        const messages = await this.chatService.getMessages(data.conversationId, client.data.userId);
        client.emit('messages_history', messages);
    }
    async handleMessage(client, data) {
        const message = await this.chatService.saveMessage(data.conversationId, client.data.userId, data.content);
        this.server.to(data.conversationId).emit('new_message', message);
    }
    async startConversation(client, data) {
        const convo = await this.chatService.getOrCreateConversation(client.data.userId, data.friendId);
        client.emit('conversation_started', convo);
    }
    handleTyping(client, data) {
        client.to(data.conversationId).emit('friend_typing', {
            userId: client.data.userId,
            conversationId: data.conversationId,
        });
    }
    async handleCallUser(client, data) {
        const callerId = client.data.userId;
        const targetSocketId = this.onlineUsers.get(data.targetUserId);
        const callKey = callerId + '-' + data.targetUserId;
        this.activeCalls.set(callKey, {
            callerId,
            targetId: data.targetUserId,
            startTime: Date.now(),
            answered: false,
        });
        if (targetSocketId) {
            this.server.to(targetSocketId).emit('incoming_call', {
                callerId,
                callerName: data.callerName,
                callerAvatar: data.callerAvatar,
                offer: data.offer,
            });
        }
        setTimeout(async () => {
            const call = this.activeCalls.get(callKey);
            if (call && !call.answered) {
                this.activeCalls.delete(callKey);
                const callerSocket = this.onlineUsers.get(callerId);
                const targetSocket = this.onlineUsers.get(data.targetUserId);
                if (callerSocket)
                    this.server.to(callerSocket).emit('call_timeout');
                if (targetSocket)
                    this.server.to(targetSocket).emit('call_timeout');
                await this.logMissedCall(callerId, data.targetUserId);
            }
        }, 30000);
    }
    async logMissedCall(callerId, targetId) {
        const convo = await this.chatService.getOrCreateConversation(callerId, targetId);
        const message = await this.chatService.saveCallRecord(convo.id, callerId, 'missed');
        const callerSocket = this.onlineUsers.get(callerId);
        const targetSocket = this.onlineUsers.get(targetId);
        if (callerSocket)
            this.server.to(callerSocket).emit('new_message', message);
        if (targetSocket)
            this.server.to(targetSocket).emit('new_message', message);
    }
    handleAnswerCall(client, data) {
        const calleeId = client.data.userId;
        const callKey = data.callerId + '-' + calleeId;
        const call = this.activeCalls.get(callKey);
        if (call)
            call.answered = true;
        const callerSocketId = this.onlineUsers.get(data.callerId);
        if (callerSocketId) {
            this.server.to(callerSocketId).emit('call_answered', { answer: data.answer });
        }
    }
    handleIceCandidate(client, data) {
        const targetSocketId = this.onlineUsers.get(data.targetUserId);
        if (targetSocketId) {
            this.server.to(targetSocketId).emit('ice_candidate', { candidate: data.candidate });
        }
    }
    async handleEndCall(client, data) {
        const userId = client.data.userId;
        const targetSocketId = this.onlineUsers.get(data.targetUserId);
        if (targetSocketId) {
            this.server.to(targetSocketId).emit('call_ended');
        }
        this.activeCalls.delete(userId + '-' + data.targetUserId);
        this.activeCalls.delete(data.targetUserId + '-' + userId);
        if (data.durationSeconds && data.durationSeconds > 0) {
            const convo = await this.chatService.getOrCreateConversation(userId, data.targetUserId);
            const message = await this.chatService.saveCallRecord(convo.id, userId, 'completed', data.durationSeconds);
            if (targetSocketId)
                this.server.to(targetSocketId).emit('new_message', message);
            client.emit('new_message', message);
        }
    }
    async handleDeclineCall(client, data) {
        console.log('decline_call received from', client.data.userId, 'for caller', data.callerId);
        const calleeId = client.data.userId;
        const callerSocketId = this.onlineUsers.get(data.callerId);
        console.log('Caller socket found:', callerSocketId);
        if (callerSocketId) {
            this.server.to(callerSocketId).emit('call_declined');
            console.log('Emitted call_declined to caller');
        }
        else {
            console.log('CALLER SOCKET NOT FOUND!');
        }
        this.activeCalls.delete(data.callerId + '-' + calleeId);
        try {
            await this.logMissedCall(data.callerId, calleeId);
            console.log('Missed call logged successfully');
        }
        catch (err) {
            console.error('ERROR logging missed call:', err);
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_conversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "joinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('start_conversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "startConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call_user'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCallUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('answer_call'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleAnswerCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ice_candidate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleIceCandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('end_call'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleEndCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('decline_call'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeclineCall", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: /^http:\/\/localhost:\d+$/, credentials: true },
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        jwt_1.JwtService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map