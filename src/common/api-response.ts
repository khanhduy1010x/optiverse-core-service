export class ApiResponse<T> {
  code: number;
  message: string;
  data: NonNullable<T> | null;

  constructor(data: NonNullable<T> | null = null) {
    const responseObject: any = {
      code: 1000,
      message: 'success',
    };
    if (data !== null) {
      responseObject.data = data;
    }
    Object.assign(this, responseObject);
  }
}
