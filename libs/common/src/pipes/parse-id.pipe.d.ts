import { PipeTransform } from '@nestjs/common';
export declare class ParseIdPipe implements PipeTransform<string> {
    transform(value: string): string;
}
