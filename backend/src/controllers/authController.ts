import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { generateTokens } from "../utils/jwt.js";

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
        const user = await prisma.user.findUnique({ where: { email }});
        if(!user) {
            return res.status(400).json({ error: "Invalid email or password"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ error: "Invalid email or password"});
        }
        try {
            const { accessToken, refreshToken } = generateTokens(user.id);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, 
            });

            res.json({ accessToken, user: { id: user.id, email: user.email, name: user.name }});
        } catch (error) {
            res.status(500).json({ error: "Error generating tokens"});
        }
    } catch (error) {
        res.status(400).json({ error: "Invalid email or password"});
    }
}

