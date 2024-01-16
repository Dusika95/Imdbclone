import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { db } from "../database";
import { NewUser } from "../types";
import { randomBytes } from "crypto";
import { hashPassword } from "../utils/authentication";

export const User = z
  .object({
    email: z.string().min(1).email(),
    nickName: z.string().min(1),
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = User.parse(req.body);

  const currentEmailCheck = await db
    .selectFrom("users")
    .where("email", "=", dto!.email)
    .select(["email"])
    .executeTakeFirst();

  if (currentEmailCheck) {
    res.status(400).json({ message: "email is already taken" });

    return;
  }

  const salt = randomBytes(16).toString("base64");
  const passwordHash = hashPassword(salt, dto.password);

  const user: NewUser = {
    email: dto.email,
    nickName: dto.nickName,
    role: "user",
    passwordHash: passwordHash,
    salt: salt,
  };

  await db.insertInto("users").values(user).executeTakeFirstOrThrow();

  res.sendStatus(200);
});

export default [requestHandler];
