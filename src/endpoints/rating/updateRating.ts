import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { db } from "../../database";
import { RatingUpdate } from "../../types";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";
import updateMovieRatings from "../../events/refreshMovieRating";

export const UpdateRatingBody = z.object({
  score: z.number().gte(1).lte(5).int(),
});

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = UpdateRatingBody.parse(req.body);

  const targetRating = await db
    .selectFrom("ratings")
    .where("id", "=", parseInt(req.params.id))
    .selectAll()
    .executeTakeFirst();

  if (!targetRating || req.user!.id !== targetRating.userId) {
    res
      .status(404)
      .json({ message: "this rating does not exist or you cant modify it" });
    return;
  }

  const refreshRating: RatingUpdate = {
    score: dto.score,
  };

  await db
    .updateTable("ratings")
    .set(refreshRating)
    .where("id", "=", parseInt(req.params.id))
    .execute();
  await updateMovieRatings(targetRating.movieId);

  res.sendStatus(200);
});

export default [authenticateTokenMiddleware(["user"]), requestHandler];
