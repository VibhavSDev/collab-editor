import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { generateTokens } from "../utils/jwt.js";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, name, password: hashedPassword }
        });

        const { accessToken, refreshToken } = generateTokens(user.id);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        res.status(201).json({ accessToken, user: { id: user.id , email: user.email, name: user.name } });
    } catch (error) {
        res.status(400).json({ error: "User already exists or invalid data" });
    }
}

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        const { accessToken, refreshToken } = generateTokens(user.id);

        res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        res.json({ accessToken, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
};

export const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

    try {
        const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
        const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { userId: string };
        
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) return res.status(401).json({ error: "User not found" });

        const { accessToken } = generateTokens(payload.userId);
        
        res.json({ accessToken });
    } catch (error) {
        res.status(403).json({ error: "Invalid refresh token" });
    }
    };

export const logout = (req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    res.status(200).json({ message: "Logged out successfully" });
};

