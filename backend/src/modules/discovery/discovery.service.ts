import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findNearby(userId: string, radiusKm: number = 10) {
    const radiusMeters = radiusKm * 1000;

    // Get current user location first
    const [myLocation] = await this.userRepo.query(
      `SELECT ST_X(ul.coords) as lng, ST_Y(ul.coords) as lat
       FROM user_locations ul WHERE ul.user_id = ?`,
      [userId],
    );

    if (!myLocation) return { users: [], message: 'Update your location first' };

    const { lat, lng } = myLocation;

    const nearby = await this.userRepo.query(
      `SELECT
         u.id, u.username, u.display_name as displayName,
         u.avatar_url as avatarUrl, u.bio, u.gender,
         ROUND(ST_Distance_Sphere(ul.coords, ST_GeomFromText('POINT(${lng} ${lat})', 4326)) / 1000, 1) as distanceKm
       FROM users u
       JOIN user_locations ul ON ul.user_id = u.id
       WHERE ul.is_visible = TRUE
         AND u.is_active = TRUE
         AND u.id != ?
         AND u.id NOT IN (
           SELECT receiver_id FROM friendships WHERE requester_id = ?
           UNION
           SELECT requester_id FROM friendships WHERE receiver_id = ?
         )
         AND ST_Distance_Sphere(ul.coords, ST_GeomFromText('POINT(${lng} ${lat})', 4326)) <= ?
       ORDER BY distanceKm ASC
       LIMIT 50`,
      [userId, userId, userId, radiusMeters],
    );

    return { users: nearby, myLocation: { lat, lng } };
  }
}
