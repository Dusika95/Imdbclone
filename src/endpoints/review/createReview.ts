import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { db } from "../../database";
import { NewRating, NewReview, RatingUpdate } from "../../types";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";
import updateMovieRatings from "../../events/refreshMovieRating";

export const Review = z.object({
  movieId: z.number(),
  text: z.string().min(1).max(500),
  title: z.string().min(1).max(50),
  hasSpoiler: z.boolean(),
  rating: z.number().gte(1).lte(5).int(),
});

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = Review.parse(req.body);
  const currentUserId = req.user!.id;

  const checkCurrentReview = await db
    .selectFrom("reviews")
    .where("userId", "=", currentUserId)
    .where("movieId", "=", dto.movieId)
    .selectAll()
    .executeTakeFirst();

  if (checkCurrentReview) {
    res.status(400).json({
      message:
        "you cant writte review multiple times, but you can change the current one",
    });

    return;
  }

  const review: NewReview = {
    movieId: dto.movieId,
    text: dto.text,
    userId: currentUserId,
    title: dto.title,
    hasSpoiler: dto.hasSpoiler,
  };
  const { insertId: reviewId } = await db
    .insertInto("reviews")
    .values(review)
    .executeTakeFirstOrThrow();

  const ratingExistance = await db
    .selectFrom("ratings")
    .where("movieId", "=", dto.movieId)
    .where("userId", "=", currentUserId)
    .selectAll()
    .executeTakeFirst();

  if (ratingExistance) {
    const rating: RatingUpdate = {
      movieId: ratingExistance.movieId, // vagy a dto-ból kéne vegyem dto.movieId?
      userId: ratingExistance.userId, //parseInt(req.user.id)jobb?
      score: dto.rating,
      reviewId: Number(reviewId),
    };
    await db
      .updateTable("ratings")
      .set(rating)
      .where("id", "=", ratingExistance.id)
      .execute();
  } else {
    const rating: NewRating = {
      movieId: dto.movieId,
      userId: currentUserId,
      score: dto.rating,
      reviewId: Number(reviewId),
    };

    await db.insertInto("ratings").values(rating).execute();
  }

  await updateMovieRatings(dto.movieId);

  res.sendStatus(200);
});

export default [authenticateTokenMiddleware(["user"]), requestHandler];
