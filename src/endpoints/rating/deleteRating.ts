import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { db } from "../../database";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";
import updateMovieRatings from "../../events/refreshMovieRating";

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const rating = await db
    .selectFrom("ratings")
    .where("id", "=", parseInt(req.params.id))
    .select(["id", "movieId"])
    .executeTakeFirst();

  if (!rating) {
    res.status(404).json({ message: "this rating is not exist" });

    return;
  }

  await db.deleteFrom("ratings").where("id", "=", rating.id).execute();

  await updateMovieRatings(rating.movieId);

  res.sendStatus(200);
});

export default [
  authenticateTokenMiddleware(["moderator", "admin"]),
  requestHandler,
];
