import { JsonPreferences, IUser } from '../../interfaces';
import { User as PrismaUser } from '@prisma/client';
  

/**
 * Validates if the given object is a valid JsonPreferences.
 * @param preferences - The object to validate.
 * @returns boolean - True if valid, false otherwise.
 */

export function isValidJsonPreferences(
    preferences: any
): preferences is JsonPreferences {
    return (
      typeof preferences === 'object' &&
      preferences !== null &&
      typeof preferences.currency === 'string' &&
      typeof preferences.theme === 'string' &&
      typeof preferences.notifications === 'object' &&
      preferences.notifications !== null &&
      typeof preferences.notifications.email === 'boolean' &&
      typeof preferences.notifications.push === 'boolean' &&
      typeof preferences.notifications.priceAlerts === 'boolean'
    );
  }

  /**
   * Transforms and validates a Prisma User object into an IUser object.
   * @param prismaUser The Prisma User object or null.
   * @returns An IUser object if valid, null otherwise.
   */
  export function transformValidatePrismaUser(prismaUser: PrismaUser | null): IUser | null {
    if (!prismaUser) {
      console.warn("Prisma user is null or undefined.");
      return null;
    }
  
    const user: IUser = {
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password, // Handle securely
      name: prismaUser.name ?? undefined,
      profilePicture: prismaUser.profilePicture ?? undefined,
      verified: prismaUser.verified,
      twoFactorEnabled: prismaUser.twoFactorEnabled,
      preferences: transformValidatePreferences(prismaUser.preferences),
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  
    // Crucial field validation
      if (!user.email) {
          console.error("User email is missing or invalid.");
          return null;
      }
      if (!user.password) {
          console.error("User password is missing or invalid.");
          return null;
      }
      if (!user.id) {
          console.error("User ID is missing or invalid.");
          return null;
      }
      if (!user.createdAt || !(user.createdAt instanceof Date)) {
          console.error("User createdAt is missing or invalid.");
          return null;
      }
      if (!user.updatedAt || !(user.updatedAt instanceof Date)) {
          console.error("User updatedAt is missing or invalid.");
          return null;
      }
  
    return user;
  }
  
  /**
   * Transforms and validates raw preferences data into a JsonPreferences object.
   * @param preferences The raw preferences data from the database.
   * @returns A validated JsonPreferences object, or a default object if validation fails.
   */
  export function transformValidatePreferences(
    preferences: any
  ): JsonPreferences {
      if (!preferences) {
          console.warn(
            "Preferences data is null or undefined.\
            Using default preferences."
          );
          return getDefaultPreferences();
      }
  
      if (!isValidJsonPreferences(preferences)) {
          console.error(
            "Invalid preferences format from the database.\
            Using default preferences.", preferences
          );
          return getDefaultPreferences();
      }
  
      return preferences;
  }
  
  /**
   * Returns a default JsonPreferences object.
   * @returns The default JsonPreferences object.
   */
  const getDefaultPreferences = (): JsonPreferences => ({
      currency: 'USD',
      theme: 'light',
      notifications: {
          email: true,
          push: false,
          priceAlerts: false,
      },
  });