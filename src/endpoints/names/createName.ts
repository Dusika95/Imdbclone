import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { db } from "../../database";
import { NewName } from "../../types";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";

const MovieMember = z.object({
  fullName: z.string().min(1),
  description: z.string().min(1),
});

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = MovieMember.parse(req.body);

  const member: NewName = {
    fullName: dto.fullName,
    description: dto.description,
  };

  await db.insertInto("names").values(member).executeTakeFirstOrThrow();

  res.sendStatus(200);
});

export default [
  authenticateTokenMiddleware(["admin", "editor"]),
  requestHandler,
];
