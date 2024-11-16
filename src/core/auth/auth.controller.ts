import { AuthLoginDto } from '@core/type/auth/dto/auth-login.dto';
import { AuthRegisterDto } from '@core/type/auth/dto/auth-register.dto';
import { User } from '@core/type/user/decorators/user.decorator';
import { UserResponsInterface } from '@core/type/user/interface/user.interface';
import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { map, catchError, Observable, switchMap, of } from 'rxjs';
import { UserEntity } from 'src/module/user/user.entity';
import { UserService } from 'src/module/user/user.service';

import { AuthService } from './auth.service';

@ApiBearerAuth()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @ApiBody({ type: AuthRegisterDto })
  register(@Body() authRegisterDto: AuthRegisterDto) {
    return this.authService.register(authRegisterDto).pipe(
      map((user: UserEntity) => {
        return this.userService.buildUserResponse(user);
      }),
      catchError((error) => {
        throw new BadRequestException(error.message);
      }),
    );
  }

  @Post('login')
  @ApiBody({ type: AuthLoginDto })
  login(
    @Body() authLogin: AuthLoginDto,
  ): Observable<{ access_token: string; refresh_token: string }> {
    return this.authService
      .validateUser(authLogin.email, authLogin.password)
      .pipe(
        switchMap((user) => {
          if (!user) {
            throw new UnauthorizedException();
          }
          return this.authService.login(user);
        }),
      );
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  currentUser(@User() user: UserEntity): Observable<UserResponsInterface> {
    const users = this.userService.buildUserResponse(user);
    return of(users);
  }
}
