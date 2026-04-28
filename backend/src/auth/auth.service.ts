import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    try {
      if (!data?.email?.trim()) {
        throw new BadRequestException('Email is required');
      }

      if (!data?.password?.trim()) {
        throw new BadRequestException('Password is required');
      }

      const email = data.email.trim().toLowerCase();
      const existing = await this.userService.findByEmail(email);
      const otp = this.generateOtp();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      if (existing) {
        if (existing.isVerified) {
          throw new BadRequestException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);
        await this.userService.updateByEmail(email, {
          isVerified: false,
          name: data.name?.trim() || null,
          password: hashedPassword,
          otp,
          otpExpiry,
        });

        await this.sendOTPSafe(email, otp);
        return {
          message: 'OTP generated (check console if email fails)',
        };
      }

      const hashedPassword = await bcrypt.hash(data.password, 12);
      await this.userService.create({
        email,
        name: data.name?.trim() || null,
        password: hashedPassword,
        otp,
        otpExpiry,
      });

      await this.sendOTPSafe(email, otp);
      return {
        message: 'OTP generated (check console if email fails)',
      };
    } catch (error) {
      console.error('REGISTER ERROR:', error);
      console.log('SERVER STILL RUNNING');
      return { message: 'Registration failed but server still running' };
    }
  }

  async login(data: LoginDto) {
    const email = data.email.trim().toLowerCase();
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name }
    };
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userService.findByEmail(normalizedEmail);

    const normalizedOtp = otp.trim();

    if (!user || !user.otp || user.otp !== normalizedOtp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
      throw new BadRequestException('OTP expired');
    }

    await this.userService.updateByEmail(normalizedEmail, {
      isVerified: true,
      otp: null,
      otpExpiry: null,
    });

    return { message: 'Email verified successfully' };
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendOTPSafe(email: string, otp: string) {
    try {
      await this.sendOTP(email, otp);
    } catch (error: any) {
      console.error('OTP SEND FAILED:', error);
      this.logMailerHint(error);
      console.log('OTP (fallback):', otp);
      console.log('SERVER STILL RUNNING');
    }
  }

  private async sendOTP(email: string, otp: string): Promise<'sent' | 'debug'> {
    console.log('STEP 1: sendOTP called');
    console.log('Email:', email);
    console.log('OTP:', otp);
    console.log('EMAIL:', process.env.EMAIL_USER);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');

    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.trim();
    const APP_NAME = process.env.APP_NAME || 'Market Lab';

    if (!emailUser || !emailPass) {
      console.error('SMTP ERROR:', new Error('ENOAUTH: Missing EMAIL_USER or EMAIL_PASS'));
      console.log('OTP (fallback):', otp);
      console.log('SERVER STILL RUNNING');
      return 'debug';
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const smtpReady = await transporter.verify()
      .then(() => {
        console.log('SMTP READY');
        return true;
      })
      .catch((error: any) => {
        console.error('SMTP ERROR:', error);
        this.logMailerHint(error);
        console.log('OTP (fallback):', otp);
        console.log('SERVER STILL RUNNING');
        return false;
      });

    if (!smtpReady) {
      console.log('OTP fallback used');
      return 'debug';
    }

    try {
      await transporter.sendMail({
      from: `"${APP_NAME}" <${emailUser}>`,
      to: email,
      subject: "🔐 Your OTP Verification Code",
      html: `
        <div style="font-family: Inter, Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff;">
          
          <h2 style="color: #38bdf8;">Verify Your Account</h2>
          
          <p>Hello,</p>
          
          <p>Thank you for registering with ${APP_NAME}.</p>
          
          <p>Your One-Time Password (OTP) is:</p>
          
          <div style="
            font-size: 28px;
            font-weight: bold;
            background: #1e293b;
            padding: 12px;
            text-align: center;
            border-radius: 8px;
            letter-spacing: 4px;
            margin: 20px 0;
          ">
            ${otp}
          </div>
          
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          
          <p>If you did not request this, please ignore this email.</p>
          
          <hr style="margin: 20px 0; border-color: #334155;" />
          
          <p style="font-size: 12px; color: #94a3b8;">
            © 2026 ${APP_NAME}
          </p>
          
        </div>
    `,
    });
      console.log('OTP sent');
      return 'sent';
    } catch (error: any) {
      console.error('MAIL ERROR:', error);
      this.logMailerHint(error);
      console.log('OTP (fallback):', otp);
      console.log('OTP fallback used');
      console.log('SERVER STILL RUNNING');
      return 'debug';
    }
  }

  private logMailerHint(error: any) {
    const code = error?.code as string | undefined;

    if (code === 'ENOTFOUND') {
      this.logger.error('DNS issue: cannot resolve smtp.gmail.com', error);
      return;
    }

    if (code === 'EAUTH') {
      this.logger.error('EAUTH: Gmail authentication failed. Use a Gmail App Password in EMAIL_PASS.', error);
      return;
    }

    if (code === 'ENOAUTH') {
      this.logger.error('ENOAUTH: Missing SMTP credentials. Check EMAIL_USER and EMAIL_PASS.', error);
      return;
    }

    if (code === 'ECONNECTION') {
      this.logger.error('ECONNECTION: SMTP connection failed. Check smtp.gmail.com, port 465, secure true.', error);
      return;
    }

    this.logger.error('Failed to send OTP email.', error);
  }
}
