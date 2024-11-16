import { error } from 'console';

import { UserHasdPassword } from '@core/type/auth/decorators/UserHashPassword';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserEntity } from 'src/module/user/user.entity';
import { UserService } from 'src/module/user/user.service';

import { AuthRegisterDto } from '../type/auth/dto/auth-register.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  register(user: AuthRegisterDto): Observable<AuthRegisterDto | null> {
    return from(this.userService.createUser({ ...user })).pipe(
      catchError(() => {
        error('User registration failed');
        return of(null);
      }),
    );
  }

  login(
    user: UserHasdPassword | null,
  ): Observable<{ access_token: string; refresh_token: string }> {
    if (!user) {
      throw new Error('Invalid user');
    }
    const payload = { sub: user.id, email: user.email };
    return of({
      access_token: this.jwtService.sign(payload, {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN,
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: process.env.REFRESH_EXPIRES_IN,
      }),
    });
  }

  validateUser(
    email: string,
    password: string,
  ): Observable<Omit<UserEntity, 'password' | 'hashPassword'> | null> {
    return this.userService.findByEmail(email).pipe(
      map((user: UserEntity | null) => {
        if (user && bcrypt.compareSync(password, user.password)) {
          const { password, ...result } = user;
          return result;
        }
        return null;
      }),
      catchError((err) => {
        error('Error validating user:', err);
        return of(null);
      }),
    );
  }
}
