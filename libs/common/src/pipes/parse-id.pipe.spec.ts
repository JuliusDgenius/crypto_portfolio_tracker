import { ParseIdPipe } from './parse-id.pipe';
import { BadRequestException } from '@nestjs/common';

describe('ParseIdPipe', () => {
  let pipe: ParseIdPipe;

  beforeEach(() => {
    pipe = new ParseIdPipe();
  });

  it('should pass through valid ID string', () => {
    const validId = 'valid-id-string';
    expect(pipe.transform(validId)).toBe(validId);
  });

  it('should throw BadRequestException for empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for whitespace string', () => {
    expect(() => pipe.transform('   ')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for null', () => {
    expect(() => pipe.transform(null as any)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for undefined', () => {
    expect(() => pipe.transform(undefined as any)).toThrow(BadRequestException);
  });
}); 