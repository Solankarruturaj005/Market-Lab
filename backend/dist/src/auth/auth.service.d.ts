import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    private readonly logger;
    constructor(userService: UserService, jwtService: JwtService);
    register(data: RegisterDto): Promise<{
        message: string;
    }>;
    login(data: LoginDto): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            name: string;
        };
    }>;
    verifyOtp(email: string, otp: string): Promise<{
        message: string;
    }>;
    private generateOtp;
    private sendOTPSafe;
    private sendOTP;
    private logMailerHint;
}
