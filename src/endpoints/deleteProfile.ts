import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { db } from "../database";
import { authenticateTokenMiddleware } from "../middlewares/authentication";
import updateMovieRatings from "../events/refreshMovieRating";

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const currentUserid = req.user!.id;

  const currentMovieIdListFromUserRating = await db
    .selectFrom("ratings")
    .where("userId", "=", currentUserid)
    .select(["movieId"])
    .execute();

  await db.deleteFrom("users").where("id", "=", currentUserid).execute();

  for (let i = 0; i < currentMovieIdListFromUserRating.length; i++) {
    await updateMovieRatings(currentMovieIdListFromUserRating[i].movieId);
  }

  res.sendStatus(200);
});

export default [authenticateTokenMiddleware(["user"]), requestHandler];
