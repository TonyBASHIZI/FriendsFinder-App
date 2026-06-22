import { Gender } from '../../entities/user.entity';
export declare class UpdateProfileDto {
    displayName?: string;
    phoneNumber?: string;
    bio?: string;
    birthdate?: string;
    gender?: Gender;
    avatarUrl?: string;
}
export declare class UpdateLocationDto {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    isVisible?: boolean;
}
