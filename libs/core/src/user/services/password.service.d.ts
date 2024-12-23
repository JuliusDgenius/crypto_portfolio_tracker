export declare class PasswordService {
    private readonly SALT_ROUNDS;
    hash(password: string): Promise<string>;
    compare(password: string, hash: string): Promise<boolean>;
    generateResetToken(): string;
}
