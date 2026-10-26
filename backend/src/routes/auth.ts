import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { registerSchema, loginSchema } from "../schemas/index.js";
import { ApiError } from "../middleware/errors.js";
import type { Response } from "express";
import {
  requireAuth,
  signAccessToken
} from "../middleware/auth.js";

const router = Router();

const isProduction = process.env.NODE_ENV === "production";

function setSessionCookie(res: Response, token: string) {
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });
}
router.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);
  const email = data.email.toLowerCase();

  const existing = await User.exists({ email });

  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    name: data.name,
    email,
    passwordHash
  });

  const token = signAccessToken(user.id);
  setSessionCookie(res, token);

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

router.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({
    email: data.email.toLowerCase()
  }).select("+passwordHash");

  const passwordMatches = user
    ? await bcrypt.compare(data.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  setSessionCookie(res, signAccessToken(user.id));

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/"
  });

  res.status(204).end();
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("name email");

  if (!user) {
    throw new ApiError(401, "Account no longer exists");
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

export default router;