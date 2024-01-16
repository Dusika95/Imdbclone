import supertest from "supertest";
import app from "../app";
import { db } from "../database";
import { NewUser } from "../types";
import { truncateTables } from "../../test/utils";
import { z } from "zod";
import { User } from "./signUp";

describe("Test Signup", () => {
  beforeEach(truncateTables);
  test("It should send back 200 and create a new user", async () => {
    const requestbody: z.infer<typeof User> = {
      email: "email@email.com",
      nickName: "user",
      password: "asd",
      confirmPassword: "asd",
    };

    const response = await supertest(app).post("/signup").send(requestbody);

    expect(response.statusCode).toBe(200);

    const checkCreatedUser = await db.selectFrom("users").selectAll().execute();

    expect(checkCreatedUser.length).toBe(1);
    expect(checkCreatedUser[0].email).toBe(requestbody.email);
    expect(checkCreatedUser[0].nickName).toBe(requestbody.nickName);
    expect(checkCreatedUser[0].role).toBe("user");
  });
  test("It should send back 400 because email is already taken", async () => {
    const user: NewUser = {
      email: "email@email.com",
      nickName: "user2",
      role: "user",
      salt: "dontcare",
      passwordHash: "dontcare",
    };
    const { insertId: userId } = await db
      .insertInto("users")
      .values(user)
      .executeTakeFirstOrThrow();

    const requestbody: z.infer<typeof User> = {
      email: "email@email.com",
      nickName: "user",
      password: "asd",
      confirmPassword: "asd",
    };

    const response = await supertest(app).post("/signup").send(requestbody);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("email is already taken");

    const checkCreatedUser = await db.selectFrom("users").selectAll().execute();

    expect(checkCreatedUser.length).toBe(1);
  });
  test("It should send back 400 beacuse the pw and confirm is not match", async () => {
    const requestbody: z.infer<typeof User> = {
      email: "email@email.com",
      nickName: "user",
      password: "asd",
      confirmPassword: "asdd",
    };

    const response = await supertest(app).post("/signup").send(requestbody);

    expect(response.statusCode).toBe(400);
    expect(response.body[0].message).toBe("Passwords don't match");

    const checkCreatedUser = await db.selectFrom("users").selectAll().execute();

    expect(checkCreatedUser.length).toBe(0);
  });
});
