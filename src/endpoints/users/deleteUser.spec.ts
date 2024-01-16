import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewUser } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";

describe("Test delete user", () => {
  beforeEach(truncateTables);
  test("it should send back 200 status code and delete a user by moderator", async () => {
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

    const token = signAccessToken({
      id: Number(moderatorId),
      email: moderator.email,
      role: moderator.role,
    });
    const response = await supertest(app)
      .delete(`/users/${userId}`)
      .set("Authorization", "Bearer " + token);

    expect(response.statusCode).toBe(200);
  });
  test("it should send back 404 because admin user cant be delete", async () => {
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
      id: Number(moderatorId),
      email: moderator.email,
      role: moderator.role,
    });

    const response = await supertest(app)
      .delete(`/users/${adminId}`)
      .set("Authorization", "Bearer " + token);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("user not found or you cant delete");
  });

  test("it should send back 403 because editor cant delete user", async () => {
    const editor: NewUser = {
      nickName: "editor",
      email: "editor@editor.com",
      role: "editor",
      passwordHash: "dontcare",
      salt: "dontcare",
    };
    const { insertId: editorId } = await db
      .insertInto("users")
      .values(editor)
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

    const token = signAccessToken({
      id: Number(editorId),
      email: editor.email,
      role: editor.role,
    });
    const response = await supertest(app)
      .delete(`/users/${userId}`)
      .set("Authorization", "Bearer " + token);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("You don't have enough permission.");
  });
});
