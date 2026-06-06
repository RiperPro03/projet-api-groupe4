import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import type { RegisterInput, SafeUser } from "../models/user.model";

const SALT_ROUNDS = 10;

export async function registerUser(data: RegisterInput): Promise<SafeUser> {
    const email = data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("EMAIL_ALREADY_USED");
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
        },
        select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
}