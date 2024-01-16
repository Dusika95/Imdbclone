import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { db } from "../../database";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";
import { z } from "zod";
import { MovieUpdate, NewCastAndCrew } from "../../types";

const castAndCrew = z.object({
  nameId: z.number(),
  role: z.enum(["actor", "director", "writer", "composer"]),
});

export const UpdatedMovie = z.object({
  title: z.string().min(1),
  releaseDate: z.string().datetime().pipe(z.coerce.date()),
  description: z.string().min(1),
  castAndCrew: z.array(castAndCrew).min(1),
});

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = UpdatedMovie.parse(req.body);

  const targetMovie = await db
    .selectFrom("movies")
    .where("id", "=", parseInt(req.params.id))
    .selectAll()
    .executeTakeFirst();

  if (!targetMovie) {
    res.status(404).json({ message: "this movie not exist" });

    return;
  }

  const movieUpdate: MovieUpdate = {
    title: dto.title,
    releaseDate: dto.releaseDate,
    description: dto.description,
  };

  await db
    .updateTable("movies")
    .set(movieUpdate)
    .where("id", "=", parseInt(req.params.id))
    .execute();

  await db
    .deleteFrom("castAndCrew")
    .where("movieId", "=", parseInt(req.params.id))
    .execute();

  if (dto.castAndCrew.length > 0) {
    const castAndCrewMap: NewCastAndCrew[] = dto.castAndCrew.map((x) => ({
      movieId: parseInt(req.params.id),
      nameId: x.nameId,
      role: x.role,
    }));

    await db.insertInto("castAndCrew").values(castAndCrewMap).execute();
  }

  res.sendStatus(200);
});

export default [
  authenticateTokenMiddleware(["admin", "editor"]),
  requestHandler,
];
