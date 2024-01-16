import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { db } from "../../database";

export interface MemberDto {
  fullName: string;
  role: string;
}
export interface MovieDto {
  title: string;
  rating: number;
  description: string;
  releaseDate: string;
  castAndCrew: MemberDto[];
}

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const movie = await db
    .selectFrom("movies")
    .where("id", "=", parseInt(req.params.id))
    .selectAll()
    .executeTakeFirst();

  if (!movie) {
    res.status(404).json({ message: "this movie is not exist" });

    return;
  }

  const castAndCrew = await db
    .selectFrom("castAndCrew")
    .innerJoin("names", "castAndCrew.nameId", "names.id")
    .where("movieId", "=", parseInt(req.params.id))
    .selectAll()
    .execute();

  const response: MovieDto = {
    title: movie.title,
    rating: movie.rating,
    releaseDate: movie.releaseDate.toISOString(),
    description: movie.description,
    castAndCrew: castAndCrew.map((x) => ({
      fullName: x.fullName,
      role: x.role.toString(),
    })),
  };

  res.json(response);
});

export default [requestHandler];
