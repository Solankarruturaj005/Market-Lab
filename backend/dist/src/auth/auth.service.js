"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../user/user.service");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
let AuthService = AuthService_1 = class AuthService {
    constructor(userService, jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.otpAttemptMap = new Map();
        this.loginAttemptMap = new Map();
        this.otpRateLimitMap = new Map();
    }
    isDevMode() {
        return process.env.NODE_ENV !== 'production';
    }
    async register(data) {
        try {
            if (!data?.email?.trim()) {
                throw new common_1.BadRequestException('Email is required');
            }
            if (!data?.password?.trim()) {
                throw new common_1.BadRequestException('Password is required');
            }
            const email = data.email.trim().toLowerCase();
            const existing = await this.userService.findByEmail(email);
            if (existing) {
                if (existing.isVerified) {
                    throw new common_1.BadRequestException('User with this email already exists');
                }
                const passwordMatches = await bcrypt.compare(data.password, existing.password);
                const isPendingExpired = !existing.otpExpiry || existing.otpExpiry.getTime() < Date.now();
                if (!passwordMatches && !isPendingExpired) {
                    throw new common_1.ConflictException('A registration is already pending for this email address. Please verify your account using the code sent or wait for it to expire before trying again.');
                }
                const lastRequested = this.otpRateLimitMap.get(email);
                if (lastRequested && Date.now() - lastRequested < 30000) {
                    const waitSec = Math.ceil((30000 - (Date.now() - lastRequested)) / 1000);
                    throw new common_1.BadRequestException(`Please wait ${waitSec}s before requesting a new verification code.`);
                }
                const otp = this.generateOtp();
                const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
                this.otpRateLimitMap.set(email, Date.now());
                this.otpAttemptMap.delete(email);
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
                    throw new common_1.ServiceUnavailableException('Unable to deliver verification code email. Please verify SMTP settings or try again shortly.');
                }
                return {
                    message: this.isDevMode() && sendResult === 'debug'
                        ? 'OTP generated (check console in development mode)'
                        : 'Verification code sent to your email',
                };
            }
            const lastRequested = this.otpRateLimitMap.get(email);
            if (lastRequested && Date.now() - lastRequested < 30000) {
                const waitSec = Math.ceil((30000 - (Date.now() - lastRequested)) / 1000);
                throw new common_1.BadRequestException(`Please wait ${waitSec}s before requesting another verification code.`);
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
                throw new common_1.ServiceUnavailableException('Unable to deliver verification code email. Please verify SMTP settings or try again shortly.');
            }
            return {
                message: this.isDevMode() && sendResult === 'debug'
                    ? 'OTP generated (check console in development mode)'
                    : 'Verification code sent to your email',
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error('Registration processing failure', error?.message);
            throw new common_1.InternalServerErrorException('Registration request failed');
        }
    }
    async login(data) {
        const email = data.email.trim().toLowerCase();
        const lock = this.loginAttemptMap.get(email);
        if (lock && lock.lockUntil > Date.now()) {
            const waitSeconds = Math.ceil((lock.lockUntil - Date.now()) / 1000);
            throw new common_1.UnauthorizedException(`Account temporarily locked due to multiple failed login attempts. Please wait ${waitSeconds}s.`);
        }
        const user = await this.userService.findByEmail(email);
        if (!user) {
            this.recordFailedLogin(email, lock);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            this.recordFailedLogin(email, lock);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isVerified) {
            throw new common_1.UnauthorizedException('Please verify your email before logging in');
        }
        this.loginAttemptMap.delete(email);
        const payload = { sub: user.id, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, name: user.name },
        };
    }
    recordFailedLogin(email, lock) {
        const currentAttempts = (lock?.attempts ?? 0) + 1;
        if (currentAttempts >= 5) {
            this.loginAttemptMap.set(email, {
                attempts: currentAttempts,
                lockUntil: Date.now() + 5 * 60 * 1000,
            });
            this.logger.warn(`Account login locked for 5 minutes: ${email}`);
        }
        else {
            this.loginAttemptMap.set(email, {
                attempts: currentAttempts,
                lockUntil: 0,
            });
        }
    }
    async verifyOtp(email, otp) {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedOtp = otp.trim();
        const record = this.otpAttemptMap.get(normalizedEmail) || { attempts: 0, lockUntil: 0 };
        if (record.attempts >= 5) {
            await this.userService.updateByEmail(normalizedEmail, {
                otp: null,
                otpExpiry: null,
            });
            this.otpAttemptMap.delete(normalizedEmail);
            throw new common_1.BadRequestException('Too many failed verification attempts. This verification code has been invalidated. Please register again to request a new code.');
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
                throw new common_1.BadRequestException('Too many failed verification attempts. This verification code has been invalidated. Please register again to request a new code.');
            }
            throw new common_1.BadRequestException(`Invalid verification code. ${remaining} attempt(s) remaining.`);
        }
        if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Verification code has expired. Please register again to receive a fresh code.');
        }
        this.otpAttemptMap.delete(normalizedEmail);
        await this.userService.updateByEmail(normalizedEmail, {
            isVerified: true,
            otp: null,
            otpExpiry: null,
        });
        return { message: 'Email verified successfully' };
    }
    async resendOtp(rawEmail) {
        if (!rawEmail?.trim()) {
            throw new common_1.BadRequestException('Email is required');
        }
        const email = rawEmail.trim().toLowerCase();
        const existing = await this.userService.findByEmail(email);
        if (!existing) {
            throw new common_1.BadRequestException('No account found for provided email');
        }
        if (existing.isVerified) {
            throw new common_1.BadRequestException('Account is already verified. Please sign in.');
        }
        const lastRequested = this.otpRateLimitMap.get(email);
        if (lastRequested && Date.now() - lastRequested < 30000) {
            const waitSec = Math.ceil((30000 - (Date.now() - lastRequested)) / 1000);
            throw new common_1.BadRequestException(`Please wait ${waitSec}s before requesting a new verification code.`);
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
            throw new common_1.ServiceUnavailableException('Unable to deliver verification code email. Please verify SMTP settings or try again shortly.');
        }
        return {
            message: this.isDevMode() && sendResult === 'debug'
                ? 'OTP regenerated (check console in development mode)'
                : 'Verification code resent to your email',
        };
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async sendOTPSafe(email, otp) {
        try {
            return await this.sendOTP(email, otp);
        }
        catch (error) {
            this.logMailerHint(error);
            if (this.isDevMode()) {
                this.logger.warn(`[DEV ONLY] Failed sending email to ${email}. Fallback OTP: ${otp}`);
                return 'debug';
            }
            this.logger.error(`Failed sending verification email to ${email} in production`);
            return 'failed';
        }
    }
    async sendOTP(email, otp) {
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
            .catch((error) => {
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
        }
        catch (error) {
            this.logMailerHint(error);
            if (this.isDevMode()) {
                this.logger.warn(`[DEV ONLY] sendMail error. Fallback OTP for ${email}: ${otp}`);
                return 'debug';
            }
            return 'failed';
        }
    }
    logMailerHint(error) {
        const code = error?.code;
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
};
AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map