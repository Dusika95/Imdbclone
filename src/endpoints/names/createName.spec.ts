import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewName, NewUser } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";

describe("Test create a new name", () => {
  beforeEach(truncateTables);
  test("It should return 200 and create a new name by editor user", async () => {
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

    const requestBody: NewName = {
      fullName: "Kis Pista",
      description: "nagyon jó zenéket ír",
    };

    const response = await supertest(app)
      .post("/names")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(200);

    const checkCreatedName = await db.selectFrom("names").selectAll().execute();

    expect(checkCreatedName!.length).toBe(1);
    expect(checkCreatedName![0].fullName).toBe(requestBody.fullName);
    expect(checkCreatedName![0].description).toBe(requestBody.description);
  });
  test("It should return 403 because user role not have the permission to update a name", async () => {
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

    const token = signAccessToken({
      id: Number(userId),
      email: user!.email,
      role: user.role,
    });

    const requestBody: NewName = {
      fullName: "Kis Pista",
      description: "nagyon jó zenéket ír",
    };

    const response = await supertest(app)
      .post("/names")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("You don't have enough permission.");
  });
});
