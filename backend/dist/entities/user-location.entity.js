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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLocation = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserLocation = class UserLocation {
    id;
    userId;
    coords;
    accuracyMeters;
    isVisible;
    updatedAt;
    user;
};
exports.UserLocation = UserLocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserLocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], UserLocation.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'point', nullable: true }),
    __metadata("design:type", String)
], UserLocation.prototype, "coords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accuracy_meters', type: 'float', nullable: true }),
    __metadata("design:type", Number)
], UserLocation.prototype, "accuracyMeters", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_visible', default: true }),
    __metadata("design:type", Boolean)
], UserLocation.prototype, "isVisible", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], UserLocation.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserLocation.prototype, "user", void 0);
exports.UserLocation = UserLocation = __decorate([
    (0, typeorm_1.Entity)('user_locations')
], UserLocation);
//# sourceMappingURL=user-location.entity.js.map