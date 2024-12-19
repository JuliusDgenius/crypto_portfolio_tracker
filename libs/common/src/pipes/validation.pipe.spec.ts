import { ValidationPipe } from './validation.pipe';
import { BadRequestException } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';

class TestDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe();
  });

  it('should validate and transform valid data', async () => {
    const testData = { name: 'test' };
    const result = await pipe.transform(testData, { 
      metatype: TestDto,
      type: 'body',
      data: ''
    });
    expect(result).toBeInstanceOf(TestDto);
    expect(result.name).toBe('test');
  });

  it('should throw BadRequestException for invalid data', async () => {
    const testData = { name: '' };
    await expect(
      pipe.transform(testData, { 
        metatype: TestDto,
        type: 'body',
        data: ''
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should pass through data when no metatype is provided', async () => {
    const testData = { name: 'test' };
    const result = await pipe.transform(testData, { 
      metatype: undefined,
      type: 'body',
      data: ''
    });
    expect(result).toEqual(testData);
  });

  it('should pass through data for primitive types', async () => {
    const testData = 'test';
    const result = await pipe.transform(testData, { 
      metatype: String,
      type: 'body',
      data: ''
    });
    expect(result).toBe(testData);
  });
}); 