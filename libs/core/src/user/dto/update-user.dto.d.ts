import { UserPreferences } from '../interfaces/user.interface';
export declare class UpdateUserDto {
    email?: string;
    username?: string;
    profilePicture?: string;
    preferences?: Partial<UserPreferences>;
}
