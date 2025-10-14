import { RequestOptions } from 'src/type/task.test.type';
import { getToken } from './login.helper';

describe('AuthController - E2E', () => {
  const baseUrl = 'http://reverse-proxy:81';
  let validToken: string;

  beforeAll(async () => {
    validToken = await getToken(baseUrl);
  });

  /* === 1️⃣ REGISTER === */
  const registerCases: RequestOptions[] = [
    {
      name: 'POST /core/auth/register - Success',
      method: 'post',
      path: '/core/auth/register',
      tokenType: 'missing',
      body: {
        email: 'newuser1@example.com',
        full_name: 'John Doe',
        password: 'password123',
      },
      expectedStatus: 201,
      expectCode: 1000,
    },
    {
      name: 'POST /core/auth/register - Email already exists',
      method: 'post',
      path: '/core/auth/register',
      tokenType: 'missing',
      body: {
        email: 'newuser1@example.com',
        full_name: 'John Doe',
        password: 'password123',
      },
      expectedStatus: 400,
      expectCode: 1016,
    },
    {
      name: 'POST /core/auth/register - Missing required fields',
      method: 'post',
      path: '/core/auth/register',
      tokenType: 'missing',
      body: { email: 'test@example.com' },
      expectedStatus: 400,
      expectCode: 1002,
    },
    {
      name: 'POST /core/auth/register - Invalid email format',
      method: 'post',
      path: '/core/auth/register',
      tokenType: 'missing',
      body: {
        email: 'invalid-email',
        full_name: 'John Doe',
        password: 'password123',
      },
      expectedStatus: 400,
      expectCode: 1008,
    },
    {
      name: 'POST /core/auth/register - Empty full_name',
      method: 'post',
      path: '/core/auth/register',
      tokenType: 'missing',
      body: {
        email: 'test@example.com',
        full_name: '',
        password: 'password123',
      },
      expectedStatus: 400,
      expectCode: 1002,
    },
  ];

  it.each(registerCases)('$name', async (tc) => {
    await makeRequest(baseUrl, { ...tc, token: validToken });
  });

  /* === 2️⃣ VERIFY ACCOUNT === */
  const verifyAccountCases: RequestOptions[] = [
    {
      name: 'POST /core/auth/verify-account - Success (email verification)',
      method: 'post',
      path: '/core/auth/verify-account',
      tokenType: 'missing',
      body: { email: 'newuser1@example.com', otp: '{otp}', isVerify: true },
      expectedStatus: 201,
      expectCode: 1000,
    },
    {
      name: 'POST /core/auth/verify-account - Success (password reset)',
      method: 'post',
      path: '/core/auth/verify-account',
      tokenType: 'missing',
      body: { email: 'newuser1@example.com', otp: '{otp}', isVerify: false },
      expectedStatus: 201,
      expectCode: 1000,
    },
    {
      name: 'POST /core/auth/verify-account - Missing required fields',
      method: 'post',
      path: '/core/auth/verify-account',
      tokenType: 'missing',
      body: { email: 'newuser1@example.com' },
      expectedStatus: 400,
      expectCode: 1002,
    },
    {
      name: 'POST /core/auth/verify-account - Time out',
      method: 'post',
      path: '/core/auth/verify-account',
      tokenType: 'missing',
      body: { email: 'newuser1@example.com', otp: '{otp}', isVerify: true },
      expectedStatus: 400,
      expectCode: 1012,
    },
    {
      name: 'POST /core/auth/verify-account - Invalid OTP',
      method: 'post',
      path: '/core/auth/verify-account',
      tokenType: 'missing',
      body: { email: 'newuser1@example.com', otp: '000000', isVerify: true },
      expectedStatus: 400,
      expectCode: 1013,
    },
    {
      name: 'POST /core/auth/verify-account - Duplicate and verified',
      method: 'post',
      path: '/core/auth/verify-account',
      tokenType: 'missing',
      body: { email: 'newuser1@example.com', isVerify: true },
      expectedStatus: 400,
      expectCode: 1011,
    },
    {
      name: 'POST /core/auth/verify-account - Invalid email format',
      method: 'post',
      path: '/core/auth/verify-account',
      tokenType: 'missing',
      body: { email: 'invalid-email', otp: '123456', isVerify: true },
      expectedStatus: 400,
      expectCode: 1008,
    },
  ];

  it.each(verifyAccountCases)('$name', async (tc) => {
    await makeRequest(baseUrl, { ...tc, token: validToken });
  });

  /* === 3️⃣ RESEND OTP === */
  const resendOtpCases: RequestOptions[] = [
    {
      name: 'POST /core/auth/resend-otp - Success (email verification)',
      method: 'post',
      path: '/core/auth/resend-otp',
      tokenType: 'missing',
      body: { email: 'newuser1@example.com', isVerify: true },
      expectedStatus: 201,
      expectCode: 1000,
    },
    {
      name: 'POST /core/auth/resend-otp - Success (password reset)',
      method: 'post',
      path: '/core/auth/resend-otp',
      tokenType: 'missing',
      body: { email: 'newuser1@example.com', isVerify: false },
      expectedStatus: 201,
      expectCode: 1000,
    },
    {
      name: 'POST /core/auth/resend-otp - Too many requests',
      method: 'post',
      path: '/core/auth/resend-otp',
      tokenType: 'missing',
      body: { email: 'newuser1@example.com', isVerify: true },
      expectedStatus: 400,
      expectCode: 1014,
    },
    {
      name: 'POST /core/auth/resend-otp - Invalid email format',
      method: 'post',
      path: '/core/auth/resend-otp',
      tokenType: 'missing',
      body: { email: 'invalid-email', isVerify: true },
      expectedStatus: 400,
      expectCode: 1002,
    },
  ];

  it.each(resendOtpCases)('$name', async (tc) => {
    await makeRequest(baseUrl, { ...tc, token: validToken });
  });

  /* === 4️⃣ LOGIN === */
  const loginCases: RequestOptions[] = [
    {
      name: 'POST /core/auth/login - Success',
      method: 'post',
      path: '/core/auth/login',
      tokenType: 'missing',
      body: {
        email: 'newuser1@example.com',
        password: 'password123',
        device_info: 'iPhone 14 - iOS 16.3',
      },
      expectedStatus: 200,
      expectCode: 1000,
    },
    {
      name: 'POST /core/auth/login - Invalid credentials',
      method: 'post',
      path: '/core/auth/login',
      tokenType: 'missing',
      body: {
        email: 'newuser1@example.com',
        password: 'wrongpassword',
        device_info: 'iPhone 14 - iOS 16.3',
      },
      expectedStatus: 401,
      expectCode: 1005,
    },
    {
      name: 'POST /core/auth/login - Missing required fields',
      method: 'post',
      path: '/core/auth/login',
      tokenType: 'missing',
      body: { email: 'newuser1@example.com' },
      expectedStatus: 400,
      expectCode: 1002,
    },
    {
      name: 'POST /core/auth/login - Invalid email format',
      method: 'post',
      path: '/core/auth/login',
      tokenType: 'missing',
      body: {
        email: 'invalid-email',
        password: 'password123',
        device_info: 'iPhone 14 - iOS 16.3',
      },
      expectedStatus: 400,
      expectCode: 1008,
    },
  ];

  it.each(loginCases)('$name', async (tc) => {
    await makeRequest(baseUrl, { ...tc, token: validToken });
  });

  /* === 5️⃣ REFRESH TOKEN === */
  const refreshTokenCases: RequestOptions[] = [
    {
      name: 'POST /core/auth/refresh-token - Success',
      method: 'post',
      path: '/core/auth/refresh-token',
      tokenType: 'valid',
      token: '<valid_access_token>',
      expectedStatus: 201,
      expectCode: 1000,
    },
    {
      name: 'POST /core/auth/refresh-token - Invalid token',
      method: 'post',
      path: '/core/auth/refresh-token',
      tokenType: 'invalid',
      expectedStatus: 401,
      expectCode: 1005,
    },
    {
      name: 'POST /core/auth/refresh-token - Missing token',
      method: 'post',
      path: '/core/auth/refresh-token',
      tokenType: 'missing',
      expectedStatus: 401,
      expectCode: 1005,
    },
  ];

  it.each(refreshTokenCases)('$name', async (tc) => {
    await makeRequest(baseUrl, { ...tc, token: validToken });
  });

  /* === 6️⃣ GET /me === */
  const getMeCases: RequestOptions[] = [
    {
      name: 'GET /core/auth/me - Success',
      method: 'get',
      path: '/core/auth/me',
      tokenType: 'valid',
      expectedStatus: 200,
      expectCode: 1000,
    },
    {
      name: 'GET /core/auth/me - Unauthorized',
      method: 'get',
      path: '/core/auth/me',
      tokenType: 'missing',
      expectedStatus: 401,
      expectCode: 1005,
    },
  ];

  it.each(getMeCases)('$name', async (tc) => {
    await makeRequest(baseUrl, { ...tc, token: validToken });
  });
});
