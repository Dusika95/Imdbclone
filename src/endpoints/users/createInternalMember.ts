import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { db } from "../../database";
import { randomBytes } from "crypto";
import { hashPassword } from "../../utils/authentication";
import { NewUser } from "../../types";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";

export const InternalMember = z
  .object({
    nickName: z.string().min(1),
    email: z.string().min(1),
    role: z.enum(["editor", "moderator"]),
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = InternalMember.parse(req.body);

  const salt = randomBytes(16).toString("base64");
  const passwordHash = hashPassword(salt, dto.password);

  const internalMember: NewUser = {
    email: dto.email,
    nickName: dto.nickName,
    role: dto.role,
    passwordHash: passwordHash,
    salt: salt,
  };

  await db.insertInto("users").values(internalMember).executeTakeFirstOrThrow();

  res.sendStatus(200);
});

export default [authenticateTokenMiddleware(["admin"]), requestHandler];
