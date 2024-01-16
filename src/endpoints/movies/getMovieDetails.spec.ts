import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewCastAndCrew, NewMovie, NewName } from "../../types";
import { truncateTables } from "../../../test/utils";
import { MovieDto } from "./getMovieDetails";

describe("test get a specific movie by id", () => {
  beforeEach(truncateTables);
  test("It should send back a movie with detail information and 200 status code", async () => {
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

    const name: NewName = {
      fullName: "Kis Pista",
      description: "nagyon jó zenéket ír",
    };
    const { insertId: nameId } = await db
      .insertInto("names")
      .values(name)
      .executeTakeFirstOrThrow();

    const castAndCrew: NewCastAndCrew = {
      movieId: Number(movieId),
      nameId: Number(nameId),
      role: "composer",
    };
    const { insertId: castAndCrewId } = await db
      .insertInto("castAndCrew")
      .values(castAndCrew)
      .executeTakeFirstOrThrow();

    const response = await supertest(app).get(`/movies/${movieId}`);

    expect(response.statusCode).toBe(200);

    const data: MovieDto = response.body;

    expect(data.title).toBe(movie.title);
    expect(data.rating).toBe(movie.rating);
    expect(data.releaseDate).toBe(movie.releaseDate.toISOString());
    expect(data.description).toBe(movie.description);
    expect(data.castAndCrew.length).toBe(1);
    expect(data.castAndCrew[0].fullName).toBe(name.fullName);
    expect(data.castAndCrew[0].role).toBe(castAndCrew.role);
  });
  test("it should send back 404 because movies table be empty", async () => {
    const response = await supertest(app).get(`/movies/1`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("this movie is not exist");
  });
});
