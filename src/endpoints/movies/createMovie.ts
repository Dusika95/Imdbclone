import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { db } from "../../database";
import { NewMovie, NewCastAndCrew } from "../../types";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";

const castAndCrew = z.object({
  nameId: z.number(),
  role: z.enum(["actor", "director", "writer", "composer"]),
});

export const Movie = z.object({
  title: z.string().min(1),
  releaseDate: z.string().datetime().pipe(z.coerce.date()),
  description: z.string().min(1),
  castAndCrew: z.array(castAndCrew),
});

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = Movie.parse(req.body);

  const movie: NewMovie = {
    title: dto.title,
    rating: 0,
    releaseDate: dto.releaseDate,
    description: dto.description,
  };

  const { insertId: movieId } = await db
    .insertInto("movies")
    .values(movie)
    .executeTakeFirstOrThrow();

  const castAndCrew: NewCastAndCrew[] = dto.castAndCrew.map((x) => ({
    movieId: Number(movieId),
    nameId: x.nameId,
    role: x.role,
  }));

  await db.insertInto("castAndCrew").values(castAndCrew).execute();

  res.sendStatus(200);
});

export default [authenticateTokenMiddleware(["editor"]), requestHandler];
