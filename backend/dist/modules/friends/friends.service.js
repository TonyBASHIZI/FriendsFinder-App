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
exports.FriendsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const friendship_entity_1 = require("../../entities/friendship.entity");
const user_entity_1 = require("../../entities/user.entity");
let FriendsService = class FriendsService {
    friendshipRepo;
    userRepo;
    constructor(friendshipRepo, userRepo) {
        this.friendshipRepo = friendshipRepo;
        this.userRepo = userRepo;
    }
    async sendRequest(requesterId, receiverId) {
        if (requesterId === receiverId)
            throw new common_1.BadRequestException('Cannot add yourself');
        const existing = await this.friendshipRepo.findOne({
            where: [
                { requesterId, receiverId },
                { requesterId: receiverId, receiverId: requesterId },
            ],
        });
        if (existing)
            throw new common_1.BadRequestException('Request already exists');
        const friendship = this.friendshipRepo.create({ requesterId, receiverId });
        await this.friendshipRepo.save(friendship);
        return { success: true };
    }
    async respond(userId, friendshipId, accept) {
        const friendship = await this.friendshipRepo.findOne({
            where: { id: friendshipId, receiverId: userId, status: friendship_entity_1.FriendshipStatus.PENDING },
        });
        if (!friendship)
            throw new common_1.NotFoundException('Request not found');
        friendship.status = accept ? friendship_entity_1.FriendshipStatus.ACCEPTED : friendship_entity_1.FriendshipStatus.DECLINED;
        friendship.respondedAt = new Date();
        await this.friendshipRepo.save(friendship);
        return { success: true };
    }
    async getPending(userId) {
        const requests = await this.friendshipRepo.find({
            where: { receiverId: userId, status: friendship_entity_1.FriendshipStatus.PENDING },
            relations: { requester: true },
            order: { createdAt: 'DESC' },
        });
        return requests.map((r) => ({
            id: r.id,
            createdAt: r.createdAt,
            requester: {
                id: r.requester.id,
                username: r.requester.username,
                displayName: r.requester.displayName,
                avatarUrl: r.requester.avatarUrl,
                bio: r.requester.bio,
            },
        }));
    }
    async getFriends(userId) {
        const friendships = await this.friendshipRepo.find({
            where: [
                { requesterId: userId, status: friendship_entity_1.FriendshipStatus.ACCEPTED },
                { receiverId: userId, status: friendship_entity_1.FriendshipStatus.ACCEPTED },
            ],
            relations: { requester: true, receiver: true },
            order: { respondedAt: 'DESC' },
        });
        return friendships.map((f) => {
            const friend = f.requesterId === userId ? f.receiver : f.requester;
            return {
                friendshipId: f.id,
                id: friend.id,
                username: friend.username,
                displayName: friend.displayName,
                avatarUrl: friend.avatarUrl,
                bio: friend.bio,
            };
        });
    }
};
exports.FriendsService = FriendsService;
exports.FriendsService = FriendsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(friendship_entity_1.Friendship)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FriendsService);
//# sourceMappingURL=friends.service.js.map