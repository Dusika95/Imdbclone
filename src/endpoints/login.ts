import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { db } from "../database";
import { signAccessToken } from "../utils/authentication";
import { hashPassword } from "../utils/authentication";

export const UserLoginModel = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = UserLoginModel.parse(req.body);

  const user = await db
    .selectFrom("users")
    .where("email", "=", dto.email)
    .selectAll()
    .executeTakeFirst();

  if (!user) {
    res.status(401).json({
      message: "Incorrect username or password.",
    });

    return;
  }

  const passwordHash = hashPassword(user.salt, dto.password);

  if (passwordHash !== user.passwordHash) {
    res.status(401).json({
      message: "Incorrect username or password.",
    });

    return;
  }

  res.status(200).json({
    accesToken: signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    }),
  });
});

export default [requestHandler];
