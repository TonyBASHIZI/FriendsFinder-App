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
exports.DiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../entities/user.entity");
let DiscoveryService = class DiscoveryService {
    userRepo;
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async findNearby(userId, radiusKm = 10) {
        const radiusMeters = radiusKm * 1000;
        const [myLocation] = await this.userRepo.query(`SELECT ST_X(ul.coords) as lng, ST_Y(ul.coords) as lat
       FROM user_locations ul WHERE ul.user_id = ?`, [userId]);
        if (!myLocation)
            return { users: [], message: 'Update your location first' };
        const { lat, lng } = myLocation;
        const nearby = await this.userRepo.query(`SELECT
         u.id, u.username, u.display_name as displayName,
         u.avatar_url as avatarUrl, u.bio, u.gender,
         ROUND(ST_Distance_Sphere(ul.coords, ST_GeomFromText('POINT(${lng} ${lat})', 4326)) / 1000, 1) as distanceKm,
         COALESCE((
           SELECT f.status FROM friendships f
           WHERE (f.requester_id = ? AND f.receiver_id = u.id)
              OR (f.receiver_id = ? AND f.requester_id = u.id)
           LIMIT 1
         ), 'none') as friendStatus
       FROM users u
       JOIN user_locations ul ON ul.user_id = u.id
       WHERE ul.is_visible = TRUE
         AND u.is_active = TRUE
         AND u.id != ?
         AND ST_Distance_Sphere(ul.coords, ST_GeomFromText('POINT(${lng} ${lat})', 4326)) <= ?
       ORDER BY distanceKm ASC
       LIMIT 50`, [userId, userId, userId, radiusMeters]);
        return { users: nearby, myLocation: { lat, lng } };
    }
};
exports.DiscoveryService = DiscoveryService;
exports.DiscoveryService = DiscoveryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DiscoveryService);
//# sourceMappingURL=discovery.service.js.map