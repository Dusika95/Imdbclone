import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewName, NewUser, NewMovie } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";
import { Movie } from "./createMovie";
import { z } from "zod";

describe("Test create a new movie", () => {
  beforeEach(truncateTables);
  test("It should return 200 and create a movie", async () => {
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

    const requestBody: z.infer<typeof Movie> = {
      title: "A vak asszony visszanéz",
      releaseDate: new Date(2022, 1, 1),
      description: "hihetetlen fordulatok",
      castAndCrew: [{ nameId: Number(nameId), role: "composer" }],
    };

    const response = await supertest(app)
      .post("/movies")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(200);

    const checkCreatedMovie = await db
      .selectFrom("movies")
      .selectAll()
      .execute();

    const checkCreateCastAndCrew = await db
      .selectFrom("castAndCrew")
      .selectAll()
      .execute();

    expect(checkCreatedMovie!.length).toBe(1);
    expect(checkCreatedMovie![0].title).toBe(requestBody.title);
    expect(checkCreatedMovie![0].releaseDate.toISOString).toBe(
      requestBody.releaseDate.toISOString
    );
    expect(checkCreatedMovie![0].description).toBe(requestBody.description);
    expect(checkCreateCastAndCrew!.length).toBe(1);
    expect(checkCreateCastAndCrew![0].nameId).toBe(
      requestBody.castAndCrew[0].nameId
    );
    expect(checkCreateCastAndCrew![0].role).toBe(
      requestBody.castAndCrew[0].role
    );
    expect(checkCreateCastAndCrew![0].movieId).toBe(
      Number(checkCreatedMovie![0].id)
    );
  });
  test("It should return 403 because user role not have the permission to create movies", async () => {
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

    const requestBody: z.infer<typeof Movie> = {
      title: "A vak asszony visszanéz",
      releaseDate: new Date(2022, 1, 1),
      description: "hihetetlen fordulatok",
      castAndCrew: [{ nameId: Number(nameId), role: "actor" }],
    };

    const response = await supertest(app)
      .post("/movies")
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("You don't have enough permission.");
  });
});
