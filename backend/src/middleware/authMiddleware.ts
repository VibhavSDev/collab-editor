import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret';
    const verified = jwt.verify(token, ACCESS_SECRET);
    (req as any).user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: "Token expired or invalid" });
  }
};