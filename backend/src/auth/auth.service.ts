import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
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

  // In-memory rate limiting and brute force protection maps
  private readonly otpAttemptMap = new Map<string, { attempts: number; lockUntil: number }>();
  private readonly loginAttemptMap = new Map<string, { attempts: number; lockUntil: number }>();
  private readonly otpRateLimitMap = new Map<string, number>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private isDevMode(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

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

      if (existing) {
        if (existing.isVerified) {
          throw new BadRequestException('User with this email already exists');
        }

        // Prevent registration hijacking of pending accounts
        const passwordMatches = await bcrypt.compare(data.password, existing.password);
        const isPendingExpired = !existing.otpExpiry || existing.otpExpiry.getTime() < Date.now();

        if (!passwordMatches && !isPendingExpired) {
          throw new ConflictException(
            'A registration is already pending for this email address. Please verify your account using the code sent or wait for it to expire before trying again.',
          );
        }

        // Rate-limit OTP regeneration to at most once per 30 seconds
        const lastRequested = this.otpRateLimitMap.get(email);
        if (lastRequested && Date.now() - lastRequested < 30_000) {
          const waitSec = Math.ceil((30_000 - (Date.now() - lastRequested)) / 1000);
          throw new BadRequestException(`Please wait ${waitSec}s before requesting a new verification code.`);
        }

        const otp = this.generateOtp();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        this.otpRateLimitMap.set(email, Date.now());
        this.otpAttemptMap.delete(email); // Reset attempt counter on fresh OTP issuance

        const hashedPassword = passwordMatches
          ? existing.password
          : await bcrypt.hash(data.password, 12);

        await this.userService.updateByEmail(email, {
          name: data.name?.trim() || existing.name,
          password: hashedPassword,
          otp,
          otpExpiry,
        });

        const sendResult = await this.sendOTPSafe(email, otp);
        if (sendResult === 'failed') {
          throw new ServiceUnavailableException(
            'Unable to deliver verification code email. Please verify SMTP settings or try again shortly.',
          );
        }

        return {
          message:
            this.isDevMode() && sendResult === 'debug'
              ? 'OTP generated (check console in development mode)'
              : 'Verification code sent to your email',
        };
      }

      // Check rate limit for fresh registration
      const lastRequested = this.otpRateLimitMap.get(email);
      if (lastRequested && Date.now() - lastRequested < 30_000) {
        const waitSec = Math.ceil((30_000 - (Date.now() - lastRequested)) / 1000);
        throw new BadRequestException(`Please wait ${waitSec}s before requesting another verification code.`);
      }

      const otp = this.generateOtp();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      this.otpRateLimitMap.set(email, Date.now());
      this.otpAttemptMap.delete(email);

      const hashedPassword = await bcrypt.hash(data.password, 12);
      await this.userService.create({
        email,
        name: data.name?.trim() || null,
        password: hashedPassword,
        otp,
        otpExpiry,
      });

      const sendResult = await this.sendOTPSafe(email, otp);
      if (sendResult === 'failed') {
        throw new ServiceUnavailableException(
          'Unable to deliver verification code email. Please verify SMTP settings or try again shortly.',
        );
      }

      return {
        message:
          this.isDevMode() && sendResult === 'debug'
            ? 'OTP generated (check console in development mode)'
            : 'Verification code sent to your email',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Registration processing failure', error?.message);
      throw new InternalServerErrorException('Registration request failed');
    }
  }

  async login(data: LoginDto) {
    const email = data.email.trim().toLowerCase();

    // Check account lockout
    const lock = this.loginAttemptMap.get(email);
    if (lock && lock.lockUntil > Date.now()) {
      const waitSeconds = Math.ceil((lock.lockUntil - Date.now()) / 1000);
      throw new UnauthorizedException(
        `Account temporarily locked due to multiple failed login attempts. Please wait ${waitSeconds}s.`,
      );
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      this.recordFailedLogin(email, lock);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      this.recordFailedLogin(email, lock);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Reset login attempts on success
    this.loginAttemptMap.delete(email);

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  private recordFailedLogin(email: string, lock?: { attempts: number; lockUntil: number }) {
    const currentAttempts = (lock?.attempts ?? 0) + 1;
    if (currentAttempts >= 5) {
      this.loginAttemptMap.set(email, {
        attempts: currentAttempts,
        lockUntil: Date.now() + 5 * 60 * 1000, // 5 min lockout
      });
      this.logger.warn(`Account login locked for 5 minutes: ${email}`);
    } else {
      this.loginAttemptMap.set(email, {
        attempts: currentAttempts,
        lockUntil: 0,
      });
    }
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    const record = this.otpAttemptMap.get(normalizedEmail) || { attempts: 0, lockUntil: 0 };

    if (record.attempts >= 5) {
      await this.userService.updateByEmail(normalizedEmail, {
        otp: null,
        otpExpiry: null,
      });
      this.otpAttemptMap.delete(normalizedEmail);
      throw new BadRequestException(
        'Too many failed verification attempts. This verification code has been invalidated. Please register again to request a new code.',
      );
    }

    const user = await this.userService.findByEmail(normalizedEmail);

    if (!user || !user.otp || user.otp !== normalizedOtp) {
      record.attempts += 1;
      this.otpAttemptMap.set(normalizedEmail, record);
      const remaining = 5 - record.attempts;

      if (remaining <= 0) {
        if (user) {
          await this.userService.updateByEmail(normalizedEmail, {
            otp: null,
            otpExpiry: null,
          });
        }
        this.otpAttemptMap.delete(normalizedEmail);
        throw new BadRequestException(
          'Too many failed verification attempts. This verification code has been invalidated. Please register again to request a new code.',
        );
      }

      throw new BadRequestException(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired. Please register again to receive a fresh code.');
    }

    // Success: clear attempts and mark user verified
    this.otpAttemptMap.delete(normalizedEmail);
    await this.userService.updateByEmail(normalizedEmail, {
      isVerified: true,
      otp: null,
      otpExpiry: null,
    });

    return { message: 'Email verified successfully' };
  }

  async resendOtp(rawEmail: string) {
    if (!rawEmail?.trim()) {
      throw new BadRequestException('Email is required');
    }

    const email = rawEmail.trim().toLowerCase();
    const existing = await this.userService.findByEmail(email);

    if (!existing) {
      throw new BadRequestException('No account found for provided email');
    }

    if (existing.isVerified) {
      throw new BadRequestException('Account is already verified. Please sign in.');
    }

    const lastRequested = this.otpRateLimitMap.get(email);
    if (lastRequested && Date.now() - lastRequested < 30_000) {
      const waitSec = Math.ceil((30_000 - (Date.now() - lastRequested)) / 1000);
      throw new BadRequestException(`Please wait ${waitSec}s before requesting a new verification code.`);
    }

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    this.otpRateLimitMap.set(email, Date.now());
    this.otpAttemptMap.delete(email);

    await this.userService.updateByEmail(email, {
      otp,
      otpExpiry,
    });

    const sendResult = await this.sendOTPSafe(email, otp);
    if (sendResult === 'failed') {
      throw new ServiceUnavailableException(
        'Unable to deliver verification code email. Please verify SMTP settings or try again shortly.',
      );
    }

    return {
      message:
        this.isDevMode() && sendResult === 'debug'
          ? 'OTP regenerated (check console in development mode)'
          : 'Verification code resent to your email',
    };
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendOTPSafe(email: string, otp: string): Promise<'sent' | 'debug' | 'failed'> {
    try {
      return await this.sendOTP(email, otp);
    } catch (error: any) {
      this.logMailerHint(error);
      if (this.isDevMode()) {
        this.logger.warn(`[DEV ONLY] Failed sending email to ${email}. Fallback OTP: ${otp}`);
        return 'debug';
      }
      this.logger.error(`Failed sending verification email to ${email} in production`);
      return 'failed';
    }
  }

  private async sendOTP(email: string, otp: string): Promise<'sent' | 'debug' | 'failed'> {
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.trim();
    const APP_NAME = process.env.APP_NAME || 'Market Lab';

    if (!emailUser || !emailPass) {
      if (this.isDevMode()) {
        this.logger.warn(`[DEV ONLY] Missing SMTP credentials. Fallback OTP for ${email}: ${otp}`);
        return 'debug';
      }
      this.logger.error('SMTP credentials missing (EMAIL_USER or EMAIL_PASS) in production');
      return 'failed';
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    const smtpReady = await transporter.verify()
      .then(() => true)
      .catch((error: any) => {
        this.logMailerHint(error);
        return false;
      });

    if (!smtpReady) {
      if (this.isDevMode()) {
        this.logger.warn(`[DEV ONLY] SMTP verify failed. Fallback OTP for ${email}: ${otp}`);
        return 'debug';
      }
      return 'failed';
    }

    try {
      await transporter.sendMail({
        from: `"${APP_NAME}" <${emailUser}>`,
        to: email,
        subject: '🔐 Your OTP Verification Code',
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
      return 'sent';
    } catch (error: any) {
      this.logMailerHint(error);
      if (this.isDevMode()) {
        this.logger.warn(`[DEV ONLY] sendMail error. Fallback OTP for ${email}: ${otp}`);
        return 'debug';
      }
      return 'failed';
    }
  }

  private logMailerHint(error: any) {
    const code = error?.code as string | undefined;

    if (code === 'ENOTFOUND') {
      this.logger.error('DNS issue: cannot resolve smtp.gmail.com');
      return;
    }

    if (code === 'EAUTH') {
      this.logger.error('EAUTH: Gmail authentication failed. Use a Gmail App Password in EMAIL_PASS.');
      return;
    }

    if (code === 'ENOAUTH') {
      this.logger.error('ENOAUTH: Missing SMTP credentials. Check EMAIL_USER and EMAIL_PASS.');
      return;
    }

    if (code === 'ECONNECTION') {
      this.logger.error('ECONNECTION: SMTP connection failed. Check smtp.gmail.com, port 587, secure false.');
      return;
    }

    this.logger.error(`Failed to send OTP email: ${error?.message ?? 'Unknown error'}`);
  }
}
