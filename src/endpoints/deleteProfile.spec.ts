import supertest from "supertest";
import app from "../app";
import { db } from "../database";
import { NewUser } from "../types";
import { signAccessToken } from "../utils/authentication";
import { truncateTables } from "../../test/utils";

describe("Test delete profile", () => {
  beforeEach(truncateTables);
  test("It shoul send back 200 and delete profile", async () => {
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

    const token = signAccessToken({
      id: Number(userId),
      email: user.email,
      role: user.role,
    });
    const response = await supertest(app)
      .delete(`/profile`)
      .set("Authorization", "Bearer " + token);

    expect(response.statusCode).toBe(200);
  });
});
