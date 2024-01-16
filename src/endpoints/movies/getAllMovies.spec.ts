import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewMovie } from "../../types";
import { truncateTables } from "../../../test/utils";
import { MoviesListDto } from "./getAllMovies";

describe("Test get all movies", () => {
  beforeEach(truncateTables);
  test("It should return a movie list with status 200", async () => {
    const movie: NewMovie = {
      title: "A vak asszony visszanéz",
      rating: 3,
      releaseDate: new Date(2022, 1, 1),
      description: "hihetetlen fordulatok",
    };
    const { insertId: movieId } = await db
      .insertInto("movies")
      .values(movie)
      .executeTakeFirstOrThrow();

    const response = await supertest(app).get("/movies");

    expect(response.statusCode).toBe(200);

    const data: MoviesListDto[] = response.body;

    expect(data.length).toBe(1);
    expect(data[0].id).toBe(Number(movieId));
    expect(data[0].title).toBe(movie.title);
    expect(data[0].rating).toBe(movie.rating);
    expect(data[0].releaseDate).toBe(movie.releaseDate.toISOString());
    expect(data[0].description).toBe(movie.description);
  });
  test("It should return array with one element with use page count", async () => {
    const movie: NewMovie = {
      title: "A vak asszony visszanéz",
      rating: 3,
      releaseDate: new Date(2022, 1, 1),
      description: "hihetetlen fordulatok",
    };
    const { insertId: movieId } = await db
      .insertInto("movies")
      .values(movie)
      .executeTakeFirstOrThrow();

    const movie2: NewMovie = {
      title: "A vak asszony mégsem néz vissza",
      rating: 2,
      releaseDate: new Date(2022, 4, 1),
      description: "kevésbbé fordulatos",
    };
    const { insertId: movie2Id } = await db
      .insertInto("movies")
      .values(movie2)
      .executeTakeFirstOrThrow();

    const response = await supertest(app).get(
      "/movies?pageIndex=1&pageCount=1"
    );

    expect(response.statusCode).toBe(200);

    const data: MoviesListDto[] = response.body;

    expect(data.length).toBe(1);
    expect(data[0].title).toBe(movie2.title);
    expect(data[0].id).toBe(Number(movie2Id));
  });
  test("It should send back an empty array", async () => {
    const response = await supertest(app).get("/movies");

    expect(response.statusCode).toBe(200);

    const data: MoviesListDto[] = response.body;

    expect(data.length).toBe(0);
  });
});
