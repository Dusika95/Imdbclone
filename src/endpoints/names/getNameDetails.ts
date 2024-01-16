import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { db } from "../../database";
import { jsonArrayFrom } from "kysely/helpers/mysql";

export interface Name {
  id: number;
  fullName: string;
  description: string;
  movies: { movieId: number; movieTitle: string; role: string }[];
}

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const targetId = parseInt(req.params!.id);

  const targetName = await db
    .selectFrom("names")
    .select((eb) => [
      "id",
      "fullName",
      "description",
      jsonArrayFrom(
        eb
          .selectFrom("castAndCrew")
          .innerJoin("movies", "movies.id", "castAndCrew.movieId")
          .select([
            "castAndCrew.movieId",
            "castAndCrew.role as role",
            "movies.title as title",
          ])
          .whereRef("castAndCrew.nameId", "=", "names.id")
      ).as("castAndCrew"),
    ])
    .where("id", "=", targetId)
    .executeTakeFirst();

  if (!targetName) {
    res
      .status(404)
      .json({ message: "this name is not exist in the collection" });

    return;
  }

  const response: Name = {
    id: targetName.id,
    description: targetName.description,
    fullName: targetName.fullName,
    movies: targetName.castAndCrew.map((x) => ({
      movieId: x.movieId,
      movieTitle: x.title,
      role: x.role,
    })),
  };

  res.status(200).json(response);
});
export default [requestHandler];
