import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewRating, NewMovie, NewUser } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";
import { z } from "zod";
import { UpdateRatingBody } from "./updateRating";

describe("Test upgrade rating", () => {
  beforeEach(truncateTables);
  test("It should send back a 200 satus code and proper changed score", async () => {
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
      movieId: Number(movieId),
      score: 5,
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

    const requestBody: z.infer<typeof UpdateRatingBody> = {
      score: 3,
    };

    const response = await supertest(app)
      .put(`/ratings/${ratingId}`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(200);

    const checkRatingChange = await db
      .selectFrom("ratings")
      .selectAll()
      .executeTakeFirst();

    expect(checkRatingChange!.score).toBe(requestBody.score);
    expect(checkRatingChange!.movieId).toBe(Number(movieId));
    expect(checkRatingChange!.reviewId).toBe(null);
    expect(checkRatingChange!.userId).toBe(Number(userId));
  });
  test("It should send back 404 because user want to change other user rating", async () => {
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
      movieId: Number(movieId),
      score: 5,
      userId: Number(userId),
    };
    const { insertId: ratingId } = await db
      .insertInto("ratings")
      .values(rating)
      .executeTakeFirstOrThrow();

    const user2: NewUser = {
      nickName: "user2",
      email: "user2@user.com",
      role: "user",
      passwordHash: "dontcare",
      salt: "dontcare",
    };
    const { insertId: user2Id } = await db
      .insertInto("users")
      .values(user2)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(user2Id),
      email: user.email,
      role: user.role,
    });

    const requestBody: z.infer<typeof UpdateRatingBody> = {
      score: 3,
    };

    const response = await supertest(app)
      .put(`/ratings/${ratingId}`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(
      "this rating does not exist or you cant modify it"
    );
  });
});
