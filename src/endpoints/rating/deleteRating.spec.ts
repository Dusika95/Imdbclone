import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewRating, NewMovie, NewUser } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";

describe("Test delete rating", () => {
  beforeEach(truncateTables);

  test("It should send back 200 status code and delete the rating on the given id", async () => {
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
      id: Number(moderatorId),
      email: moderator.email,
      role: moderator.role,
    });

    const response = await supertest(app)
      .delete(`/ratings/${ratingId}`)
      .set("Authorization", "Bearer " + token);

    expect(response.statusCode).toBe(200);

    const checkDeletedionFromRating = await db
      .selectFrom("ratings")
      .selectAll()
      .execute();

    expect(checkDeletedionFromRating.length).toBe(0);
  });
  test("It should send back a 404 because selected rating not exist", async () => {
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
      .executeTakeFirst();

    const token = signAccessToken({
      id: Number(moderatorId),
      email: moderator.email,
      role: moderator.role,
    });

    const response = await supertest(app)
      .delete("/ratings/1")
      .set("Authorization", "Bearer " + token);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("this rating is not exist");
  });
});
