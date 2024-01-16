import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewUser, NewMovie, NewReview, NewRating } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";
import { Review } from "./createReview";
import { z } from "zod";

describe("Test create a new review", () => {
  beforeEach(truncateTables);
  test("It should return a 200 status code", async () => {
    const user: NewUser = {
      nickName: "normalUser",
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
      title: "A vak asszony visszanéz",
      rating: 0,
      releaseDate: new Date(2022, 1, 1),
      description: "hihetetlen fordulatok",
    };
    const { insertId: movieId } = await db
      .insertInto("movies")
      .values(movie)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(userId),
      email: user!.email,
      role: user!.role,
    });

    const requestBody: z.infer<typeof Review> = {
      movieId: Number(movieId),
      text: "ez egy remekmű mindenkinek ajánlom",
      title: "csodálatos alkotás",
      hasSpoiler: false,
      rating: 5,
    };

    const response = await supertest(app)
      .post("/reviews")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(200);

    const checkCreatedReview = await db
      .selectFrom("reviews")
      .selectAll()
      .execute();

    const checkCreatedRating = await db
      .selectFrom("ratings")
      .selectAll()
      .execute();

    const checkMovieRatingChange = await db
      .selectFrom("movies")
      .select(["rating"])
      .where("id", "=", Number(movieId))
      .executeTakeFirst();

    expect(checkCreatedReview.length).toBe(1);
    expect(checkCreatedReview[0].userId).toBe(Number(userId));
    expect(checkCreatedReview[0].movieId).toBe(requestBody.movieId);
    expect(checkCreatedReview[0].text).toBe(requestBody.text);
    expect(checkCreatedReview[0].title).toBe(requestBody.title);
    expect(checkCreatedReview[0].hasSpoiler).toBe(0);

    expect(checkCreatedRating.length).toBe(1);
    expect(checkCreatedRating[0].userId).toBe(Number(userId));
    expect(checkCreatedRating[0].movieId).toBe(requestBody.movieId);
    expect(checkCreatedRating[0].reviewId).toBe(checkCreatedReview[0].id);
    expect(checkCreatedRating[0].score).toBe(requestBody.rating);

    expect(checkMovieRatingChange!.rating).toBe(requestBody.rating);
  });
  test("It should return a 400 status code because user already have a review on the target movie", async () => {
    const user: NewUser = {
      nickName: "normalUser",
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
      title: "A vak asszony visszanéz",
      rating: 3,
      releaseDate: new Date(2022, 1, 1),
      description: "hihetetlen fordulatok",
    };
    const { insertId: movieId } = await db
      .insertInto("movies")
      .values(movie)
      .executeTakeFirstOrThrow();

    const review: NewReview = {
      userId: Number(userId),
      movieId: Number(movieId),
      text: "ez egy mestermű",
      title: "zsír",
      hasSpoiler: false,
    };
    const { insertId: reviewId } = await db
      .insertInto("reviews")
      .values(review)
      .executeTakeFirstOrThrow();

    const rating: NewRating = {
      movieId: Number(movieId),
      score: 5,
      userId: Number(userId),
      reviewId: Number(reviewId),
    };
    const { insertId: ratingId } = await db
      .insertInto("ratings")
      .values(rating)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(userId),
      email: user!.email,
      role: user!.role,
    });

    const requestBody: z.infer<typeof Review> = {
      movieId: Number(movieId),
      text: "ez egy remekmű mindenkinek ajánlom",
      title: "csodálatos alkotás",
      hasSpoiler: false,
      rating: 5,
    };

    const response = await supertest(app)
      .post("/reviews")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "you cant writte review multiple times, but you can change the current one"
    );
  });
});
