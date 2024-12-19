import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIdPipe implements PipeTransform<string> {
  transform(value: string): string {
    // Validate that the ID is a valid string format
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException('Invalid ID format');
    }
    return value;
  }
}