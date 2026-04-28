import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: number;
        email: string;
        password: string;
        isVerified: boolean;
        otp: string;
        otpExpiry: Date;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(data: Prisma.UserCreateInput): Promise<{
        id: number;
        email: string;
        password: string;
        isVerified: boolean;
        otp: string;
        otpExpiry: Date;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateByEmail(email: string, data: Prisma.UserUpdateInput): Promise<{
        id: number;
        email: string;
        password: string;
        isVerified: boolean;
        otp: string;
        otpExpiry: Date;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findById(id: number): Promise<{
        id: number;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
