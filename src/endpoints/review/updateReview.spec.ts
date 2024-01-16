import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewMovie, NewRating, NewReview, NewUser } from "../../types";
import { truncateTables } from "../../../test/utils";
import { signAccessToken } from "../../utils/authentication";
import { UpdatedReview } from "./updateReview";
import { z } from "zod";

describe("Test update review", () => {
  beforeEach(truncateTables);
  test("user can modify own review and get back status 200", async () => {
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
      userId: Number(userId),
      movieId: Number(movieId),
      score: 4,
      reviewId: Number(reviewId),
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

    const requestBody: z.infer<typeof UpdatedReview> = {
      movieId: Number(movieId),
      text: "ez nem csak egy mestermű ez maga a csoda",
      title: "zsíroskenyér",
      hasSpoiler: false,
      rating: 5,
    };

    const response = await supertest(app)
      .put(`/reviews/${reviewId}`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(200);

    const checkReviewmodify = await db
      .selectFrom("reviews")
      .where("id", "=", Number(reviewId))
      .selectAll()
      .executeTakeFirst();

    const checkRatingmodify = await db
      .selectFrom("ratings")
      .where("reviewId", "=", Number(reviewId))
      .select(["score"])
      .executeTakeFirst();

    const checkMovieRatingmodify = await db
      .selectFrom("movies")
      .where("id", "=", Number(movieId))
      .select(["rating"])
      .executeTakeFirst();

    expect(checkReviewmodify!.text).toBe(requestBody.text);
    expect(checkReviewmodify!.hasSpoiler).toBe(0);
    expect(checkReviewmodify!.movieId).toBe(requestBody.movieId);
    expect(checkReviewmodify!.title).toBe(requestBody.title);
    expect(checkRatingmodify!.score).toBe(requestBody.rating);
    expect(checkMovieRatingmodify!.rating).toBe(5);
  });
  test("it should send back 404 because not the creator user want to modify the review", async () => {
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

    const user2: NewUser = {
      nickName: "normalUser2",
      email: "user2@user.com",
      role: "user",
      passwordHash: "dontcare",
      salt: "dontcare",
    };
    const { insertId: user2Id } = await db
      .insertInto("users")
      .values(user2)
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
      userId: Number(userId),
      movieId: Number(movieId),
      score: 4,
      reviewId: Number(reviewId),
    };
    const { insertId: ratingId } = await db
      .insertInto("ratings")
      .values(rating)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(user2Id),
      email: user2.email,
      role: user2.role,
    });

    const requestBody: z.infer<typeof UpdatedReview> = {
      movieId: Number(movieId),
      text: "ez nem csak egy mestermű ez maga a csoda",
      title: "zsíroskenyér",
      hasSpoiler: false,
      rating: 5,
    };

    const response = await supertest(app)
      .put(`/reviews/${reviewId}`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("this review does not exist");
  });
});
