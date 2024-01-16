import supertest from "supertest";
import app from "../app";
import { db } from "../database";
import { NewMovie, NewRating, NewReview, NewUser, NewName } from "../types";
import { truncateTables } from "../../test/utils";
import { SearchListDto } from "./search";

describe("Test search names and movie titles", () => {
  beforeEach(truncateTables);
  test("It should send back two list of names and movies", async () => {
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

    const name: NewName = {
      fullName: "Vak Kis Pista ",
      description: "nagyon jó zenéket ír",
    };
    const { insertId: nameId } = await db
      .insertInto("names")
      .values(name)
      .executeTakeFirstOrThrow();

    const name2: NewName = {
      fullName: "Nagy Kis Pista ",
      description: "fapofa",
    };
    const { insertId: name2Id } = await db
      .insertInto("names")
      .values(name2)
      .executeTakeFirstOrThrow();

    const response = await supertest(app).get(
      `/search?searchText=vak&searchType=all`
    );
    expect(response.statusCode).toBe(200);
    const data: SearchListDto = response.body;

    expect(data.movies!.length).toBe(2);
    expect(data.moviePageIndex).toBe(0);
    expect(data.totalMovies).toBe(2);
    expect(data.names!.length).toBe(1);
    expect(data.namePageIndex).toBe(0);
    expect(data.totalNames).toBe(1);
  });
  test("It should send an empty object because no match with searched text", async () => {
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

    const name: NewName = {
      fullName: "Vak Kis Pista ",
      description: "nagyon jó zenéket ír",
    };
    const { insertId: nameId } = await db
      .insertInto("names")
      .values(name)
      .executeTakeFirstOrThrow();

    const name2: NewName = {
      fullName: "Nagy Kis Pista ",
      description: "fapofa",
    };
    const { insertId: name2Id } = await db
      .insertInto("names")
      .values(name2)
      .executeTakeFirstOrThrow();

    const response = await supertest(app).get(
      `/search?searchText=Adam&searchType=all`
    );

    expect(response.statusCode).toBe(200);

    const data: SearchListDto = response.body;

    expect(data.movies!.length).toBe(0);
    expect(data.moviePageIndex).toBe(0);
    expect(data.totalMovies).toBe(0);
    expect(data.names!.length).toBe(0);
    expect(data.namePageIndex).toBe(0);
    expect(data.totalNames).toBe(0);
  });
  test("It should send response only with names", async () => {
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

    const name: NewName = {
      fullName: "Vak Kis Pista ",
      description: "nagyon jó zenéket ír",
    };
    const { insertId: nameId } = await db
      .insertInto("names")
      .values(name)
      .executeTakeFirstOrThrow();

    const name2: NewName = {
      fullName: "Nagy Kis Pista ",
      description: "fapofa",
    };
    const { insertId: name2Id } = await db
      .insertInto("names")
      .values(name2)
      .executeTakeFirstOrThrow();

    const response = await supertest(app).get(
      `/search?searchText=vak&searchType=names`
    );

    expect(response.statusCode).toBe(200);

    const data: SearchListDto = response.body;

    expect(data.movies!).toBe(undefined);
    expect(data.moviePageIndex).toBe(undefined);
    expect(data.totalMovies).toBe(undefined);
    expect(data.names!.length).toBe(1);
    expect(data.namePageIndex).toBe(0);
    expect(data.totalNames).toBe(1);
  });
  test("It should send only response only with movies", async () => {
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

    const name: NewName = {
      fullName: "Vak Kis Pista ",
      description: "nagyon jó zenéket ír",
    };
    const { insertId: nameId } = await db
      .insertInto("names")
      .values(name)
      .executeTakeFirstOrThrow();

    const name2: NewName = {
      fullName: "Nagy Kis Pista ",
      description: "fapofa",
    };
    const { insertId: name2Id } = await db
      .insertInto("names")
      .values(name2)
      .executeTakeFirstOrThrow();

    const response = await supertest(app).get(
      `/search?searchText=vak&searchType=movieTitle`
    );

    expect(response.statusCode).toBe(200);

    const data: SearchListDto = response.body;

    expect(data.movies!.length).toBe(2);
    expect(data.moviePageIndex).toBe(0);
    expect(data.totalMovies).toBe(2);
    expect(data.names!).toBe(undefined);
    expect(data.namePageIndex).toBe(undefined);
    expect(data.totalNames).toBe(undefined);
  });
  test("It should send back 400 because searchType is invalid", async () => {
    const searchtypeWithtypo = "movietitlee";
    const response = await supertest(app).get(
      `/search?searchText=vak&searchType=${searchtypeWithtypo}`
    );
    expect(response.statusCode).toBe(400);
    expect(response.body[0].message).toBe(
      `Invalid enum value. Expected 'names' | 'movieTitle' | 'all', received '${searchtypeWithtypo}'`
    );
  });
});
