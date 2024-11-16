import { AuthRegisterDto } from '@core/type/auth/dto/auth-register.dto';
import { UserResponsInterface } from '@core/type/user/interface/user.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Observable, from, switchMap, catchError, of, map } from 'rxjs';
import { Repository } from 'typeorm';

import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  createUser(
    createUserDto: AuthRegisterDto,
  ): Observable<AuthRegisterDto | null> {
    return from(
      this.userRepository.findOne({ where: { email: createUserDto.email } }),
    ).pipe(
      switchMap(async (existingUser) => {
        if (existingUser) {
          throw new HttpException(
            'Email is already taken',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
        const newUser = this.userRepository.create(createUserDto);
        newUser.password = await hash(newUser.password, 10);
        return this.userRepository.save(newUser);
      }),
      catchError((err) => {
        console.error('Error creating user:', err);
        return of(null);
      }),
    );
  }

  generateToken(user: UserEntity, type: 'access' | 'refresh'): string {
    const secret =
      type === 'access'
        ? process.env.ACCESS_TOKEN_SECRET || 'default_access_secret'
        : process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret';

    if (!secret) {
      throw new Error(`Missing secret for ${type} token.`);
    }

    return sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      secret,
      { expiresIn: type === 'access' ? '1h' : '7d' },
    );
  }

  buildUserResponse(user: UserEntity): UserResponsInterface {
    return {
      user: {
        ...user,
        token: this.generateToken(user, 'access'),
        refreshToken: this.generateToken(user, 'refresh'),
      },
    };
  }

  findById(id: string): Observable<UserEntity | null> {
    return from(
      this.userRepository.findOne({
        where: { id },
      }),
    ).pipe(
      map((user) => {
        return user;
      }),
    );
  }

  findByEmail(email: string): Observable<UserEntity | null> {
    return from(this.userRepository.findOne({ where: { email } }));
  }
}
