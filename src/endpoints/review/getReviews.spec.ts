import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewMovie, NewRating, NewReview, NewUser } from "../../types";
import { truncateTables } from "../../../test/utils";
import { ReviewListDto } from "./getReviews";

describe("Test get reviews by params", () => {
  beforeEach(truncateTables);
  test("It should return a 200 status code and a list of reviews by user", async () => {
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
      hasSpoiler: true,
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

    const response = await supertest(app).get(`/reviews?userId=${userId}`);

    expect(response.statusCode).toBe(200);

    const data: ReviewListDto = response.body;

    expect(data.pageIndex).toBe(0);
    expect(data.pageCount).toBe(10);
    expect(data.total).toBe(1);
    expect(data.data[0].movieTitle).toBe(movie.title);
    expect(data.data[0].creatorName).toBe(user.nickName);
    expect(data.data[0].text).toBe(review.text);
    expect(data.data[0].reviewTitle).toBe(review.title);
  });

  test("it should send back array with one elem from page count query", async () => {
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

    const movie2: NewMovie = {
      title: "A vak asszony mégsem nézz vissza",
      rating: 3,
      releaseDate: new Date(2022, 4, 1),
      description: "kevesebb fordulat mint megszokhatuk",
    };
    const { insertId: movie2Id } = await db
      .insertInto("movies")
      .values(movie2)
      .executeTakeFirstOrThrow();

    const review2: NewReview = {
      userId: Number(userId),
      movieId: Number(movie2Id),
      text: "a másik rész jobban tetszet",
      title: "olaj",
      hasSpoiler: true,
    };
    const { insertId: review2Id } = await db
      .insertInto("reviews")
      .values(review2)
      .executeTakeFirstOrThrow();

    const rating2: NewRating = {
      movieId: Number(movie2Id),
      score: 5,
      userId: Number(userId),
      reviewId: Number(review2Id),
    };
    const { insertId: rating2Id } = await db
      .insertInto("ratings")
      .values(rating2)
      .executeTakeFirstOrThrow();

    const response = await supertest(app).get(
      `/reviews?userId=${userId}&pageCount=1`
    );

    expect(response.statusCode).toBe(200);

    const data: ReviewListDto = response.body;

    expect(data.pageIndex).toBe(0);
    expect(data.pageCount).toBe(1);
    expect(data.total).toBe(2);
    expect(data.data.length).toBe(1);
  });
  test("It should send back an empty data array because user does not create any review yet", async () => {
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

    const response = await supertest(app).get(`/reviews?userId=${userId}`);

    expect(response.statusCode).toBe(200);

    const data: ReviewListDto = response.body;

    expect(data.pageIndex).toBe(0);
    expect(data.pageCount).toBe(10);
    expect(data.total).toBe(0);
    expect(data.data.length).toBe(0);
  });
  test("It should should send back 400 because the path is a NaN", async () => {
    const response = await supertest(app).get(`/reviews?userId=k`);

    expect(response.statusCode).toBe(400);
    expect(response.body[0].message).toBe("Expected number, received nan");
  });
});
