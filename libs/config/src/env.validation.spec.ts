import { validate } from './env.validation';

describe('Environment Validation', () => {
  const validConfig = {
    PORT: 3000,
    DATABASE_URL: 'mongodb://localhost:27017/test',
    API_KEY: 'test-api-key',
  };

  it('should pass validation with valid config', () => {
    const result = validate(validConfig);
    expect(result).toBeDefined();
    expect(result.PORT).toBe(3000);
    expect(result.DATABASE_URL).toBe('mongodb://localhost:27017/test');
    expect(result.API_KEY).toBe('test-api-key');
  });

  it('should throw error when PORT is missing', () => {
    const { PORT, ...configWithoutPort } = validConfig;
    expect(() => validate(configWithoutPort)).toThrow();
  });

  it('should throw error when DATABASE_URL is missing', () => {
    const { DATABASE_URL, ...configWithoutDb } = validConfig;
    expect(() => validate(configWithoutDb)).toThrow();
  });

  it('should pass validation when optional API_KEY is missing', () => {
    const { API_KEY, ...configWithoutApiKey } = validConfig;
    const result = validate(configWithoutApiKey);
    expect(result).toBeDefined();
    expect(result.API_KEY).toBeUndefined();
  });

  it('should throw error when PORT is not a number', () => {
    expect(() => validate({ ...validConfig, PORT: 'not-a-number' })).toThrow();
  });

  it('should throw error when DATABASE_URL is not a string', () => {
    expect(() => validate({ ...validConfig, DATABASE_URL: 123 })).toThrow();
  });
}); 