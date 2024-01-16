import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewRating, NewMovie, NewUser } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";
import { Rating } from "./createRating";
import { z } from "zod";

describe("Test create rating", () => {
  beforeEach(truncateTables);
  test("It should send back 200 status code and create a new rating", async () => {
    const user: NewUser = {
      nickName: "user",
      email: "user@user.com",
      role: "user",
      passwordHash: "dontcare",
      salt: "dontcare",
    };
    const { insertId: userId } = await db
      .insertInto("users")
      .values(user)
      .executeTakeFirstOrThrow();

    const movie: NewMovie = {
      title: "A vak asszony visszanézz",
      releaseDate: new Date(2020, 1, 1),
      rating: 0,
      description: "naón jó",
    };
    const { insertId: movieId } = await db
      .insertInto("movies")
      .values(movie)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(userId),
      email: user.email,
      role: user.role,
    });

    const requestBody: z.infer<typeof Rating> = {
      movieId: Number(movieId),
      score: 5,
    };

    const response = await supertest(app)
      .post("/ratings")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(200);

    const checkCreateRating = await db
      .selectFrom("ratings")
      .selectAll()
      .execute();

    const movieRating = await db
      .selectFrom("movies")
      .where("id", "=", Number(movieId))
      .select(["rating"])
      .executeTakeFirst();

    expect(checkCreateRating!.length).toBe(1);
    expect(checkCreateRating![0].movieId).toBe(requestBody.movieId);
    expect(checkCreateRating![0].score).toBe(requestBody.score);
    expect(checkCreateRating![0].userId).toBe(Number(userId));
    expect(checkCreateRating![0].reviewId).toBe(null);

    expect(movieRating!.rating).toBe(5);
  });
  test("It should send back 400 status code beacuse one user cant create multiple rating on same movie", async () => {
    const user: NewUser = {
      nickName: "user",
      email: "user@user.com",
      role: "user",
      passwordHash: "dontcare",
      salt: "dontcare",
    };
    const { insertId: userId } = await db
      .insertInto("users")
      .values(user)
      .executeTakeFirstOrThrow();

    const movie: NewMovie = {
      title: "A vak asszony visszanézz",
      releaseDate: new Date(2020, 1, 1),
      rating: 0,
      description: "naón jó",
    };
    const { insertId: movieId } = await db
      .insertInto("movies")
      .values(movie)
      .executeTakeFirstOrThrow();

    const rating: NewRating = {
      score: 3,
      movieId: Number(movieId),
      userId: Number(userId),
    };
    const { insertId: ratingId } = await db
      .insertInto("ratings")
      .values(rating)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(userId),
      email: user.email,
      role: user.role,
    });

    const requestBody: z.infer<typeof Rating> = {
      movieId: Number(movieId),
      score: 5,
    };

    const response = await supertest(app)
      .post("/ratings")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("you cant score multiple times");
  });
});
