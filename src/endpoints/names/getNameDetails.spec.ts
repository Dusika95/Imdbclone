import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewName, NewMovie, NewCastAndCrew } from "../../types";
import { truncateTables } from "../../../test/utils";
import { Name } from "./getNameDetails";

describe("Test get name details", () => {
  beforeEach(truncateTables);
  test("It should send back 200 status and proper response with list of movies", async () => {
    const name: NewName = {
      fullName: "Kis Pista",
      description: "nagyon jó zenéket ír",
    };
    const { insertId: nameId } = await db
      .insertInto("names")
      .values(name)
      .executeTakeFirstOrThrow();

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
      rating: 3,
      releaseDate: new Date(2022, 4, 1),
      description: "hihetető fordulatok",
    };
    const { insertId: movie2Id } = await db
      .insertInto("movies")
      .values(movie2)
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

    const castAndCrew2: NewCastAndCrew = {
      movieId: Number(movie2Id),
      nameId: Number(nameId),
      role: "director",
    };
    const { insertId: castAndCrew2Id } = await db
      .insertInto("castAndCrew")
      .values(castAndCrew2)
      .executeTakeFirstOrThrow();

    const response = await supertest(app).get(`/names/${nameId}`);

    expect(response.statusCode).toBe(200);

    const data: Name = response.body;

    expect(data.fullName).toBe(name.fullName);
    expect(data.description).toBe(name.description);
    expect(data.id).toBe(Number(nameId));
    expect(data.movies.length).toBe(2);
    expect(data.movies[0].movieId).toBe(Number(movieId));
    expect(data.movies[0].movieTitle).toBe(movie.title);
    expect(data.movies[0].role).toBe(castAndCrew.role);
    expect(data.movies[1].movieId).toBe(Number(movie2Id));
    expect(data.movies[1].movieTitle).toBe(movie2.title);
    expect(data.movies[1].role).toBe(castAndCrew2.role);
  });
  test("It should send back 404 because name not found on given index", async () => {
    const response = await supertest(app).get(`/names/1`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(
      "this name is not exist in the collection"
    );
  });
  test("It should send back a name with an emty list, because the targeted name does not work on any movie", async () => {
    const name: NewName = {
      fullName: "Kis Pista",
      description: "nagyon jó zenéket ír",
    };
    const { insertId: nameId } = await db
      .insertInto("names")
      .values(name)
      .executeTakeFirstOrThrow();

    const response = await supertest(app).get(`/names/${nameId}`);

    expect(response.statusCode).toBe(200);

    const data: Name = response.body;

    expect(data.fullName).toBe(name.fullName);
    expect(data.description).toBe(name.description);
    expect(data.id).toBe(Number(nameId));
    expect(data.movies.length).toBe(0);
  });
});
