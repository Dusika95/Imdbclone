import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { db } from "../../database";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";
import updateMovieRatings from "../../events/refreshMovieRating";

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const targetUser = await db
    .selectFrom("users")
    .where("id", "=", parseInt(req.params.id))
    .select(["id", "role"])
    .executeTakeFirst();

  if (!targetUser || targetUser.role === "admin") {
    res.status(404).json({
      message: "user not found or you cant delete",
    });

    return;
  }

  const movieIdListFromUserRatings = await db
    .selectFrom("ratings")
    .where("userId", "=", parseInt(req.params.id))
    .select(["movieId"])
    .execute();

  await db
    .deleteFrom("users")
    .where("users.id", "=", parseInt(req.params.id))
    .execute();

  if (movieIdListFromUserRatings.length > 0) {
    for (let i = 0; i < movieIdListFromUserRatings.length; i++) {
      await updateMovieRatings(movieIdListFromUserRatings[i].movieId);
    }
  }

  res.sendStatus(200);
});

export default [authenticateTokenMiddleware(["moderator"]), requestHandler];
