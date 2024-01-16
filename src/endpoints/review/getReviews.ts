import { Request, Response } from "express";
import { db } from "../../database";
import asyncHandler from "express-async-handler";
import { z } from "zod";

export interface ReviewListDto {
  pageIndex: number;
  pageCount: number;
  total: number;
  data: Review[];
}
export interface Review {
  creatorName: string;
  movieTitle: string;
  text: string;
  reviewTitle: string;
  hasSpoiler: boolean;
}

const Filters = z.object({
  userId: z.coerce.number().int().optional(),
  movieId: z.coerce.number().int().optional(),
  hideSpoilers: z.coerce.boolean().optional(),
  pageIndex: z.coerce.number().int().optional(),
  pageCount: z.coerce.number().int().optional(),
});

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = Filters.parse(req.query);

  const pageIndex = dto.pageIndex || 0;
  const pageCount = dto.pageCount || 10;

  let query = db
    .selectFrom("reviews")
    .innerJoin("users", "users.id", "reviews.userId")
    .innerJoin("movies", "movies.id", "reviews.movieId")
    .innerJoin("ratings", "ratings.reviewId", "reviews.id");

  if (dto.userId) {
    query = query.where("reviews.userId", "=", dto.userId);
  }
  if (dto.movieId) {
    query = query.where("reviews.movieId", "=", dto.movieId);
  }

  const total = await query
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .executeTakeFirstOrThrow();

  const reviews = await query
    .select([
      "users.nickName as nickName",
      "movies.title as movieTitle",
      "reviews.text as text",
      "reviews.title as reviewTitle",
      "reviews.hasSpoiler",
    ])
    .offset(pageIndex * pageCount)
    .limit(pageCount)
    .execute();

  const response: ReviewListDto = {
    pageIndex: pageIndex,
    pageCount: pageCount,
    total: total.count,
    data: reviews.map((x) => ({
      creatorName: x.nickName,
      movieTitle: x.movieTitle,
      text: x.text,
      reviewTitle: x.reviewTitle,
      hasSpoiler: x.hasSpoiler,
    })),
  };

  res.status(200).json(response);
});

export default [requestHandler];
