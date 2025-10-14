import request from 'supertest';

export interface RequestOptions {
  name: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string | (() => string);
  tokenType: 'valid' | 'invalid' | 'missing';
  token?: string;
  body?: any;
  query?: Record<string, any>;
  expectedStatus: number;
  expectCode: number;
  afterSuccess?: (res: request.Response) => void;
}
