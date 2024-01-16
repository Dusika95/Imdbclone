import { Request, Response, query } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { db } from "../database";

export interface SearchListDto {
  totalNames?: number;
  totalMovies?: number;
  namePageIndex?: number;
  moviePageIndex?: number;
  names?: Name[];
  movies?: Movie[];
}
interface Name {
  id: number;
  fullName: string;
}
interface Movie {
  id: number;
  title: string;
  releaseDate: string;
}

const Filter = z.object({
  searchText: z.string().min(1),
  searchType: z.enum(["names", "movieTitle", "all"]),
  pageIndexName: z.coerce.number().int().optional(),
  pageIndexMovie: z.coerce.number().int().optional(),
});
const PAGE_COUNT = 5;

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = Filter.parse(req.query);
  const pageIndexMovie = dto.pageIndexMovie || 0;
  const pageIndexName = dto.pageIndexName || 0;

  let response: SearchListDto = {};

  if (dto.searchType === "movieTitle" || dto.searchType === "all") {
    const movieSearchData = await searchMovie(dto.searchText, pageIndexMovie);

    response.movies = movieSearchData.movies.map((x) => ({
      id: x.id,
      title: x.title,
      releaseDate: x.releaseDate.toISOString(),
    }));
    response.totalMovies = movieSearchData.countMovies.count;
    response.moviePageIndex = pageIndexMovie;
  }

  if (dto.searchType === "names" || dto.searchType === "all") {
    const nameSearchData = await searchName(dto.searchText, pageIndexName);

    response.names = nameSearchData.names.map((x) => ({
      id: x.id,
      fullName: x.fullName,
    }));
    response.totalNames = nameSearchData.countNames.count;
    response.namePageIndex = pageIndexName;
  }

  res.json(response).status(200);
});

async function searchMovie(searchText: string, index: number) {
  const movieQuery = db
    .selectFrom("movies")
    .where("title", "like", "%" + searchText + "%");

  const countMovies = await movieQuery
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .executeTakeFirstOrThrow();

  const movies = await movieQuery
    .select(["id", "title", "releaseDate"])
    .offset(index * PAGE_COUNT)
    .limit(PAGE_COUNT)
    .execute();

  return { movies, countMovies };
}

async function searchName(searchText: string, index: number) {
  const nameQuery = db
    .selectFrom("names")
    .where("fullName", "like", "%" + searchText + "%");

  const countNames = await nameQuery
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .executeTakeFirstOrThrow();

  const names = await nameQuery
    .select(["id", "fullName"])
    .offset(index * PAGE_COUNT)
    .limit(PAGE_COUNT)
    .execute();

  return { names, countNames };
}

export default [requestHandler];
