import supertest from "supertest";
import app from "../app";
import { db } from "../database";
import { NewUser } from "../types";
import { truncateTables } from "../../test/utils";
import { signAccessToken } from "../utils/authentication";
import { randomBytes } from "crypto";
import { hashPassword } from "../utils/authentication";
import { z } from "zod";
import { UpdateProfile } from "./updateProfile";

describe("Test update profiel", () => {
  beforeEach(truncateTables);
  test("It should send back 200 and change profile attriburtes", async () => {
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

    const token = signAccessToken({
      id: Number(userId),
      email: user.email,
      role: user.role,
    });

    const requestBody: z.infer<typeof UpdateProfile> = {
      email: "other@user.com",
      password: "asd",
      confirmPassword: "asd",
    };

    const response = await supertest(app)
      .put("/profile")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(200);

    const checkUserChanges = await db.selectFrom("users").selectAll().execute();

    expect(checkUserChanges.length).toBe(1);
    expect(checkUserChanges[0].email).toBe(requestBody.email);
    expect(checkUserChanges[0].passwordHash).toBe(
      hashPassword(checkUserChanges[0].salt, requestBody.password)
    );
  });
  test("It should send back 400 beacuse the email is invalid", async () => {
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

    const token = signAccessToken({
      id: Number(userId),
      email: user.email,
      role: user.role,
    });

    const requestBody: z.infer<typeof UpdateProfile> = {
      email: "otheruser.com",
      password: "asd",
      confirmPassword: "asd",
    };

    const response = await supertest(app)
      .put("/profile")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(400);
    expect(response.body[0].message).toBe("Invalid email");
  });
});
