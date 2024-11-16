import { UserEntity } from 'src/module/user/user.entity';

export type UserHasdPassword = Omit<
  UserEntity,
  'password' | 'hashPassword'
> | null;
