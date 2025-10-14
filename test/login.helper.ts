import request from 'supertest';
import { RequestOptions } from 'src/type/task.test.type';

export async function getToken(
  baseUrl: string,
  loginPath = '/core/auth/login',
) {
  const res = await request(baseUrl)
    .post(loginPath)
    .send({ email: 'vujane_7253@example.com', password: '1' })
    .expect(201);
  if (!res.body?.data?.access_token) {
    throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.access_token;
}

export function withAuth(
  req: request.Test,
  tokenType: 'valid' | 'invalid' | 'missing',
  token?: string,
) {
  switch (tokenType) {
    case 'valid':
      if (!token) throw new Error('Token required for valid type');
      return req.set('Authorization', `Bearer ${token}`);
    case 'invalid':
      return req.set('Authorization', 'Bearer expired-token');
    case 'missing':
      return req;
  }
}

export async function makeRequest(baseUrl: string, options: RequestOptions) {
  let req = request(baseUrl)[options.method](
    typeof options.path === 'function' ? options.path() : options.path,
  );

  if (options.query) {
    req = req.query(options.query);
  }
  if (options.body) {
    req = req.send(options.body);
  }

  req = withAuth(req, options.tokenType, options.token);

  const res = await req;

  expect(res.status).toBe(options.expectedStatus);

  if (res.body?.code) {
    expect(res.body.code).toBe(options.expectCode);
  }

  // Nếu có callback afterSuccess (ví dụ để lấy ID task)
  if (options.afterSuccess) {
    options.afterSuccess(res);
  }

  return res;
}
