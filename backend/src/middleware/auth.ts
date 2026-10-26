import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ApiError } from "./errors.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("JWT_SECRET must be configured securely");
  }

  return secret;
}

export function signAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    getJwtSecret(),
    { expiresIn: "15m", algorithm: "HS256" }
  );
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = req.cookies?.access_token;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"]
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !mongoose.isValidObjectId(payload.sub)
    ) {
      throw new Error("Invalid token subject");
    }

    req.userId = payload.sub;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired session"));
  }
}