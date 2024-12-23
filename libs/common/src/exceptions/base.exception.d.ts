export declare class BaseException extends Error {
    readonly message: string;
    readonly code: string;
    readonly statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
