import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewUser, NewMovie, NewReview, NewRating } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";

describe("Test delete a review", () => {
  beforeEach(truncateTables);
  test("It should return a 200 status code and delete the target review by moderator", async () => {
    const moderator: NewUser = {
      nickName: "moderator",
      email: "moderator@moderator.com",
      role: "moderator",
      passwordHash: "dontcare",
      salt: "dontcare",
    };
    const { insertId: moderatorId } = await db
      .insertInto("users")
      .values(moderator)
      .executeTakeFirstOrThrow();

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
      description: "hihetelen fordulatok",
      rating: 0,
      releaseDate: new Date(2022, 1, 1),
    };
    const { insertId: movieId } = await db
      .insertInto("movies")
      .values(movie)
      .executeTakeFirstOrThrow();

    const review: NewReview = {
      userId: Number(userId),
      movieId: Number(movieId),
      text: "ez egy mestermű",
      hasSpoiler: false,
      title: "szupi",
    };
    const { insertId: reviewId } = await db
      .insertInto("reviews")
      .values(review)
      .executeTakeFirstOrThrow();

    const rating: NewRating = {
      movieId: 1,
      userId: Number(userId),
      score: 5,
      reviewId: Number(reviewId),
    };
    const { insertId: ratingId } = await db
      .insertInto("ratings")
      .values(rating)
      .executeTakeFirst();

    const token = signAccessToken({
      id: Number(moderatorId),
      email: moderator.email,
      role: moderator.role,
    });

    const response = await supertest(app)
      .delete(`/reviews/${reviewId}`)
      .set("Authorization", "Bearer " + token);

    expect(response.statusCode).toBe(200);

    const checkDeletionOnReview = await db
      .selectFrom("reviews")
      .selectAll()
      .execute();

    const checkDeletionOnRating = await db
      .selectFrom("ratings")
      .selectAll()
      .execute();

    expect(checkDeletionOnReview.length).toBe(0);
    expect(checkDeletionOnRating.length).toBe(0);
  });
  test("It should return a 404 status code because the searched id is not exist", async () => {
    const moderator: NewUser = {
      nickName: "moderator",
      email: "moderator@moderator.com",
      role: "moderator",
      passwordHash: "dontcare",
      salt: "dontcare",
    };
    const { insertId: moderatorId } = await db
      .insertInto("users")
      .values(moderator)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(moderatorId),
      email: moderator.email,
      role: moderator.role,
    });

    const response = await supertest(app)
      .delete(`/reviews/1`)
      .set("Authorization", "Bearer " + token);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("this review does not exist");
  });
  test("It should return a 404 status code because user cant delete other user's review", async () => {
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

    const movie: NewMovie = {
      title: "A vak asszony visszanézz",
      description: "hihetelen fordulatok",
      rating: 0,
      releaseDate: new Date(2022, 1, 1),
    };
    const { insertId: movieId } = await db
      .insertInto("movies")
      .values(movie)
      .executeTakeFirstOrThrow();

    const review: NewReview = {
      userId: Number(userId),
      movieId: Number(movieId),
      text: "ez egy mestermű",
      hasSpoiler: false,
      title: "szupi",
    };
    const { insertId: reviewId } = await db
      .insertInto("reviews")
      .values(review)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(user2Id),
      email: user2.email,
      role: user2.role,
    });

    const response = await supertest(app)
      .delete(`/reviews/${reviewId}`)
      .set("Authorization", "Bearer " + token);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("this review does not exist");
  });
});
