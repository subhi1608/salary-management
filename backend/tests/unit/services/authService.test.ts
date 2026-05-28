import * as userRepo from '../../../src/repositories/userRepository';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { login, refreshAccessToken } from '../../../src/services/authService';
import { AppError } from '../../../src/types';

jest.mock('../../../src/repositories/userRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/config', () => ({
  config: {
    jwtSecret: 'test-jwt-secret',
    jwtRefreshSecret: 'test-jwt-refresh-secret',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
  },
}));

const mockPool = {} as import('pg').Pool;

const mockDbUser = {
  id: 'user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  password_hash: 'hashed-pw',
  created_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('login', () => {
  it('returns accessToken, refreshToken, and user without password_hash for valid credentials', async () => {
    jest.mocked(userRepo.findUserByEmail).mockResolvedValue(mockDbUser);
    (jest.mocked(bcrypt.compare) as any).mockResolvedValue(true);
    (jest.mocked(jwt.sign) as any)
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const result = await login(mockPool, { email: 'test@example.com', password: 'password123' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user).toMatchObject({ id: 'user-1', email: 'test@example.com', full_name: 'Test User' });
    expect(result.user).not.toHaveProperty('password_hash');
    expect(userRepo.findUserByEmail).toHaveBeenCalledWith(mockPool, 'test@example.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-pw');
    expect(jest.mocked(jwt.sign)).toHaveBeenNthCalledWith(
      1,
      { sub: 'user-1', email: 'test@example.com' },
      expect.any(String),
      expect.any(Object),
    );
  });

  it('throws INVALID_CREDENTIALS when user is not found', async () => {
    jest.mocked(userRepo.findUserByEmail).mockResolvedValue(null);

    await expect(login(mockPool, { email: 'unknown@example.com', password: 'any' }))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
  });

  it('throws INVALID_CREDENTIALS when password is incorrect', async () => {
    jest.mocked(userRepo.findUserByEmail).mockResolvedValue(mockDbUser);
    (jest.mocked(bcrypt.compare) as any).mockResolvedValue(false);

    await expect(login(mockPool, { email: 'test@example.com', password: 'wrongpassword' }))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
  });
});

describe('refreshAccessToken', () => {
  it('returns a new accessToken and userId for a valid refresh token', async () => {
    (jest.mocked(jwt.verify) as any).mockReturnValue({ sub: 'user-1', email: 'test@example.com' } as jwt.JwtPayload);
    (jest.mocked(jwt.sign) as any).mockReturnValue('new-access-token');

    const result = await refreshAccessToken('valid-refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.userId).toBe('user-1');
    expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', expect.any(String));
  });

  it('throws UNAUTHORIZED when refresh token is invalid', () => {
    (jest.mocked(jwt.verify) as any).mockImplementation(() => { throw new Error('jwt error'); });

    expect(() => refreshAccessToken('invalid-token')).toThrow(AppError);
  });
});
