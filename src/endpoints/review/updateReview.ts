import { Request, Response } from "express";
import { db } from "../../database";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { RatingUpdate, ReviewUpdate } from "../../types";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";
import updateMovieRatings from "../../events/refreshMovieRating";

export const UpdatedReview = z.object({
  movieId: z.number(),
  text: z.string().min(1),
  title: z.string().min(1),
  hasSpoiler: z.boolean(),
  rating: z.number().gte(1).lte(5).int(),
});
const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = UpdatedReview.parse(req.body);

  const targetReview = await db
    .selectFrom("reviews")
    .innerJoin("ratings", "ratings.reviewId", "reviews.id")
    .where("reviews.id", "=", parseInt(req.params.id))
    .select(["reviews.id", "ratings.id as ratingId", "reviews.userId"])
    .executeTakeFirst();

  if (!targetReview || req.user!.id !== targetReview.userId) {
    res.status(404).json({ message: "this review does not exist" });
    return;
  }

  const reviewUpdate: ReviewUpdate = {
    movieId: dto.movieId,
    text: dto.text,
    title: dto.title,
    hasSpoiler: dto.hasSpoiler,
    userId: req.user!.id,
  };

  await db
    .updateTable("reviews")
    .set(reviewUpdate)
    .where("id", "=", parseInt(req.params.id))
    .execute();

  const ratingUpdate: RatingUpdate = {
    movieId: dto.movieId,
    score: dto.rating,
    reviewId: parseInt(req.params.id),
    userId: req.user!.id,
  };

  await db
    .updateTable("ratings")
    .set(ratingUpdate)
    .where("id", "=", targetReview.ratingId)
    .execute();

  await updateMovieRatings(dto.movieId);

  res.sendStatus(200);
});

export default [authenticateTokenMiddleware(["user"]), requestHandler];
