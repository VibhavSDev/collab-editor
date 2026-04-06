import express from 'express';
import prisma from '../config/db.js';

export const createDocument = async (req: any, res: express.Response) => {
    try {
        const { title } = req.body;
        const userId = req.user.userId; // Populated by our authMiddleware

        const newDoc = await prisma.document.create({
        data: {
            title: title || "Untitled Document",
            ownerId: userId,
            // We'll leave 'content' empty for now until TipTap/Yjs starts
        }
        });

        res.status(201).json(newDoc);
    } catch (error) {
        res.status(500).json({ error: "Failed to create document" });
    }
};

export const getUserDocuments = async (req: any, res: express.Response) => {
    try {
        const userId = req.user.userId;
        const docs = await prisma.document.findMany({
            where: { ownerId: userId },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch documents" });
    }
};