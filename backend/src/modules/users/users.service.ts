import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserLocation } from '../../entities/user-location.entity';
import { UpdateProfileDto, UpdateLocationDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserLocation)
    private readonly locationRepo: Repository<UserLocation>,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.userRepo.update(userId, dto);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const existing = await this.locationRepo.findOne({ where: { userId } });
    const point = `ST_GeomFromText('POINT(${dto.longitude} ${dto.latitude})', 4326)`;

    if (existing) {
      await this.locationRepo.query(
        `UPDATE user_locations SET coords = ${point}, accuracy_meters = ?, is_visible = ? WHERE user_id = ?`,
        [dto.accuracyMeters || null, dto.isVisible ?? true, userId],
      );
    } else {
      await this.locationRepo.query(
        `INSERT INTO user_locations (id, user_id, coords, accuracy_meters, is_visible)
         VALUES (UUID(), ?, ${point}, ?, ?)`,
        [userId, dto.accuracyMeters || null, dto.isVisible ?? true],
      );
    }

    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { location: true },
    });
    if (!user) throw new NotFoundException();
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
