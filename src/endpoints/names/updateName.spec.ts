import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewName, NewUser, NameUpdate } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";

describe("Test create a new name", () => {
  beforeEach(truncateTables);
  test("It should return 200 and modify the name on given param by editor user", async () => {
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

    const name: NewName = {
      fullName: "Kis Pista",
      description: "nagyon jó zenéket ír",
    };
    const { insertId: nameId } = await db
      .insertInto("names")
      .values(name)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(editorId),
      email: editor!.email,
      role: editor!.role,
    });

    const requestBody: NameUpdate = {
      fullName: "Kis Jóska Pista",
      description: "valami új leírás",
    };

    const response = await supertest(app)
      .put(`/names/${nameId}`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(200);

    const checkNameChanges = await db.selectFrom("names").selectAll().execute();

    expect(checkNameChanges!.length).toBe(1);
    expect(checkNameChanges![0].fullName).toBe(requestBody.fullName);
    expect(checkNameChanges![0].description).toBe(requestBody.description);
  });
  test("It should return 404 because the given param is not exist(name table be empty)", async () => {
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
      role: editor!.role,
    });
    const requestBody: NameUpdate = {
      fullName: "Kis Jóska Pista",
      description: "valami új leírás emberünkről",
    };

    const response = await supertest(app)
      .put(`/names/1`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(
      "this name is not exist in the collection"
    );
  });

  test("It should return 403 because user not have auth to change name", async () => {
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

    const name: NewName = {
      fullName: "Kis Pista",
      description: "nagyon jó zenéket ír",
    };

    const { insertId: nameId } = await db
      .insertInto("names")
      .values(name)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(userId),
      email: user!.email,
      role: user!.role,
    });

    const requestBody: NameUpdate = {
      fullName: "Kis Jóska Pista",
      description: "valami új leírás emberünkről",
    };

    const response = await supertest(app)
      .put(`/names/${nameId}`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(403);
  });
});
