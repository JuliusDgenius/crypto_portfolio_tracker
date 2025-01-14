import { IsDate, IsOptional, Matches } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetPortfolioHistoryDto {
  @IsOptional()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'Invalid date format. Use dd/mm/yyyy.' })
  @Transform(({ value }) => {
    const [day, month, year] = value.split('/').map(Number);
    // Check for valid date by creating a Date object
    const date = new Date(year, month - 1, day);
    // Ensure that the Date object is valid
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      throw new Error('Invalid date. Please check the day, month, or year.');
    }
    return date;
  })
  startDate?: Date;

  @IsOptional()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'Invalid date format. Use dd/mm/yyyy.' })
  @Transform(({ value }) => {
    const [day, month, year] = value.split('/').map(Number);
    // Check for valid date by creating a Date object
    const date = new Date(year, month - 1, day);
    // Ensure that the Date object is valid
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      throw new Error('Invalid date. Please check the day, month, or year.');
    }
    return date;
  })
  @Type(() => Date)
  @IsDate({ message: 'Value must be a DateTime.' })
  endDate?: Date;

  @IsOptional()
  interval?: 'daily' | 'weekly' | 'monthly';
}
