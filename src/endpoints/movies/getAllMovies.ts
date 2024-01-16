import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { db } from "../../database";
import { z } from "zod";

export interface MoviesListDto {
  id: number;
  title: string;
  rating: number;
  description: string;
  releaseDate: string;
}
const Filters = z.object({
  pageIndex: z.coerce.number().int().optional(),
  pageCount: z.coerce.number().int().optional(),
});

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = Filters.parse(req.query);
  const pageIndex = dto.pageIndex || 0;
  const pageCount = dto.pageCount || 30;

  const movies = await db
    .selectFrom("movies")
    .selectAll()
    .offset(pageIndex * pageCount)
    .limit(pageCount)
    .execute();

  const response: MoviesListDto[] = movies.map((x) => ({
    id: x.id,
    title: x.title,
    rating: x.rating,
    description: x.description,
    releaseDate: x.releaseDate.toISOString(),
  }));

  res.status(200).json(response);
});

export default [requestHandler];
