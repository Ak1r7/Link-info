import type { UserType } from './user.type';

export interface UserResponsInterface {
  user: UserType & { token: string } & { refreshToken: string };
}
