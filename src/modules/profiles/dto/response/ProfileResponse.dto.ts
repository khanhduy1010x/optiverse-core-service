import { User } from '../../../users/user.schema';

export class ProfileResponse {
  full_name?: string;

  constructor(user: User) {
    this.full_name = user.full_name;
  }
}
