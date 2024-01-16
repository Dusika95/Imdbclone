import { Request, Response } from "express";
import { db } from "../../database";
import asyncHandler from "express-async-handler";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const targetReview = await db
    .selectFrom("reviews")
    .where("id", "=", parseInt(req.params.id))
    .selectAll()
    .executeTakeFirst();

  if (
    !targetReview ||
    (req.user!.id !== targetReview.userId && req.user!.role !== "moderator")
  ) {
    res.status(404).json({ message: "this review does not exist" });
    return;
  }

  await db
    .deleteFrom("reviews")
    .where("id", "=", parseInt(req.params.id))
    .execute();

  res.sendStatus(200);
});

export default [
  authenticateTokenMiddleware(["moderator", "user"]),
  requestHandler,
];
