import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { db } from "../database";
import { authenticateTokenMiddleware } from "../middlewares/authentication";
import { UserUpdate } from "../types";
import { z } from "zod";
import { hashPassword } from "../utils/authentication";

export const UpdateProfile = z
  .object({
    email: z.string().min(1).email(),
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = UpdateProfile.parse(req.body);
  const currentUserId = req.user!.id;

  const targetUser = await db
    .selectFrom("users")
    .where("id", "=", currentUserId)
    .selectAll()
    .executeTakeFirst();

  let passwordHash: string | undefined = undefined;

  if (dto.password) {
    passwordHash = hashPassword(targetUser!.salt, dto.password);
  }

  const user: UserUpdate = {
    email: dto.email,
    passwordHash: passwordHash,
  };

  await db
    .updateTable("users")
    .set(user)
    .where("id", "=", currentUserId)
    .execute();

  res.sendStatus(200);
});

export default [authenticateTokenMiddleware(["user"]), requestHandler];
