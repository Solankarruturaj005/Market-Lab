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
            const otp = this.generateOtp();
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
            if (existing) {
                if (existing.isVerified) {
                    throw new common_1.BadRequestException('User with this email already exists');
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
        }
        catch (error) {
            console.error('REGISTER ERROR:', error);
            console.log('SERVER STILL RUNNING');
            return { message: 'Registration failed but server still running' };
        }
    }
    async login(data) {
        const email = data.email.trim().toLowerCase();
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isVerified) {
            throw new common_1.UnauthorizedException('Please verify your email before logging in');
        }
        const payload = { sub: user.id, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, name: user.name }
        };
    }
    async verifyOtp(email, otp) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.userService.findByEmail(normalizedEmail);
        const normalizedOtp = otp.trim();
        if (!user || !user.otp || user.otp !== normalizedOtp) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
            throw new common_1.BadRequestException('OTP expired');
        }
        await this.userService.updateByEmail(normalizedEmail, {
            isVerified: true,
            otp: null,
            otpExpiry: null,
        });
        return { message: 'Email verified successfully' };
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async sendOTPSafe(email, otp) {
        try {
            await this.sendOTP(email, otp);
        }
        catch (error) {
            console.error('OTP SEND FAILED:', error);
            this.logMailerHint(error);
            console.log('OTP (fallback):', otp);
            console.log('SERVER STILL RUNNING');
        }
    }
    async sendOTP(email, otp) {
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
            .catch((error) => {
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
        }
        catch (error) {
            console.error('MAIL ERROR:', error);
            this.logMailerHint(error);
            console.log('OTP (fallback):', otp);
            console.log('OTP fallback used');
            console.log('SERVER STILL RUNNING');
            return 'debug';
        }
    }
    logMailerHint(error) {
        const code = error?.code;
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
};
AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map