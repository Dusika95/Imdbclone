import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewUser } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";
import { hashPassword } from "../../utils/authentication";
import { z } from "zod";
import { InternalMember } from "./createInternalMember";

describe("Test create editor/moderator", () => {
  beforeEach(truncateTables);
  test("It should send back 200 status code", async () => {
    const admin: NewUser = {
      nickName: "admin",
      email: "admin@admin.com",
      role: "admin",
      passwordHash: "dontcare",
      salt: "dontcare",
    };
    const { insertId: adminId } = await db
      .insertInto("users")
      .values(admin)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(adminId),
      email: admin!.email,
      role: admin.role,
    });
    const requestBody: z.infer<typeof InternalMember> = {
      nickName: "editor",
      email: "editor@editor.com",
      role: "editor",
      password: "dontcare",
      confirmPassword: "dontcare",
    };
    const response = await supertest(app)
      .post("/users")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(200);

    const checkUserCreation = await db
      .selectFrom("users")
      .selectAll()
      .where("role", "=", "editor")
      .execute();

    expect(checkUserCreation.length).toBe(1);
    expect(checkUserCreation[0].email).toBe(requestBody.email);
    expect(checkUserCreation[0].nickName).toBe(requestBody.nickName);
    expect(checkUserCreation[0].role).toBe(requestBody.role);
    expect(checkUserCreation[0].passwordHash).toBe(
      hashPassword(checkUserCreation[0].salt, requestBody.password)
    );
  });
  test("It should send back 403 because editor cant create other editor", async () => {
    const editor: NewUser = {
      nickName: "editorUser",
      email: "editor@editor.com",
      role: "editor",
      passwordHash: "dontcare",
      salt: "dontcare",
    };
    const { insertId: editorId } = await db
      .insertInto("users")
      .values(editor)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(editorId),
      email: editor!.email,
      role: editor.role,
    });

    const requestBody: z.infer<typeof InternalMember> = {
      nickName: "editor",
      email: "editor@editor.com",
      role: "editor",
      password: "dontcare",
      confirmPassword: "dontcare",
    };
    const response = await supertest(app)
      .post("/users")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("You don't have enough permission.");
  });
  test("It should send back 400 because given role type cant be created by admin", async () => {
    const admin: NewUser = {
      nickName: "admin",
      email: "admin@admin.com",
      role: "admin",
      passwordHash: "dontcare",
      salt: "dontcare",
    };
    const { insertId: adminId } = await db
      .insertInto("users")
      .values(admin)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(adminId),
      email: admin!.email,
      role: admin.role,
    });
    const requestBody = {
      nickName: "user",
      email: "user@user.com",
      role: "user",
      password: "dontcare",
      confirmPassword: "dontcare",
    };
    const response = await supertest(app)
      .post("/users")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(400);
    expect(response.body[0].message).toBe(
      "Invalid enum value. Expected 'editor' | 'moderator', received 'user'"
    );
  });
});
