import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { db } from "../../database";
import { NewRating } from "../../types";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";
import updateMovieRatings from "../../events/refreshMovieRating";

export const Rating = z.object({
  movieId: z.number(),
  score: z.number().gte(1).lte(5).int(),
});

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = Rating.parse(req.body);

  const currentUserId = req.user!.id;

  const checkcurrentRating = await db
    .selectFrom("ratings")
    .where("movieId", "=", dto.movieId)
    .where("userId", "=", currentUserId)
    .selectAll()
    .executeTakeFirst();

  if (checkcurrentRating) {
    res.status(400).json({ message: "you cant score multiple times" });

    return;
  }

  const rating: NewRating = {
    movieId: dto.movieId,
    score: dto.score,
    userId: currentUserId,
  };

  await db.insertInto("ratings").values(rating).executeTakeFirstOrThrow();

  await updateMovieRatings(dto.movieId);

  res.sendStatus(200);
});

export default [authenticateTokenMiddleware(["user"]), requestHandler];
