import { UserLocation } from './user-location.entity';
export declare enum Gender {
    MALE = "male",
    FEMALE = "female",
    NON_BINARY = "non_binary",
    PREFER_NOT = "prefer_not"
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
    birthdate: string;
    gender: Gender;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    location: UserLocation;
}
