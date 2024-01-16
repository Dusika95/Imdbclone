import supertest from "supertest";
import app from "../app";
import { db } from "../database";
import { NewUser } from "../types";
import { truncateTables } from "../../test/utils";
import { randomBytes } from "crypto";
import { hashPassword } from "../utils/authentication";
import { z } from "zod";
import { UserLoginModel } from "./login";

describe("Test login", () => {
  beforeEach(truncateTables);
  test("It should send back a token", async () => {
    const salt = randomBytes(16).toString("base64");
    const passwordHash = hashPassword(salt, "dontcare");
    const user: NewUser = {
      nickName: "user",
      email: "user@user.com",
      role: "user",
      passwordHash: passwordHash,
      salt: salt,
    };
    const { insertId: userId } = await db
      .insertInto("users")
      .values(user)
      .executeTakeFirstOrThrow();

    const requestBody: z.infer<typeof UserLoginModel> = {
      email: user.email,
      password: "dontcare",
    };

    const response = await supertest(app).post("/login").send(requestBody);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("accesToken");
  });
  test("It should send back 401 and error message because password is incorrect", async () => {
    const salt = randomBytes(16).toString("base64");
    const passwordHash = hashPassword(salt, "dontcare");
    const user: NewUser = {
      nickName: "user",
      email: "user@user.com",
      role: "user",
      passwordHash: passwordHash,
      salt: salt,
    };
    const { insertId: userId } = await db
      .insertInto("users")
      .values(user)
      .executeTakeFirstOrThrow();

    const requestBody: z.infer<typeof UserLoginModel> = {
      email: user.email,
      password: "incorrectPassword",
    };

    const response = await supertest(app).post("/login").send(requestBody);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Incorrect username or password.");
  });
  test("It should send back 401 because email not exist", async () => {
    const salt = randomBytes(16).toString("base64");
    const passwordHash = hashPassword(salt, "dontcare");
    const user: NewUser = {
      nickName: "user",
      email: "user@user.com",
      role: "user",
      passwordHash: passwordHash,
      salt: salt,
    };
    const { insertId: userId } = await db
      .insertInto("users")
      .values(user)
      .executeTakeFirstOrThrow();

    const requestBody: z.infer<typeof UserLoginModel> = {
      email: "incorrect@email.com",
      password: user.passwordHash,
    };

    const response = await supertest(app).post("/login").send(requestBody);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Incorrect username or password.");
  });
});
