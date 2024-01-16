import supertest from "supertest";
import app from "../../app";
import { db } from "../../database";
import { NewName, NewUser, NewMovie, NewCastAndCrew } from "../../types";
import { signAccessToken } from "../../utils/authentication";
import { truncateTables } from "../../../test/utils";
import { UpdatedMovie } from "./updateMovie";
import { z } from "zod";

describe("Test update a movie", () => {
  beforeEach(truncateTables);

  test("it should update a movie by editor user", async () => {
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

    const movie: NewMovie = {
      title: "A vak asszony visszanéz",
      rating: 3,
      releaseDate: new Date(2022, 1, 1),
      description: "hihetetlen fordulatok",
    };
    const { insertId: movieId } = await db
      .insertInto("movies")
      .values(movie)
      .executeTakeFirstOrThrow();

    const name: NewName = {
      fullName: "Kis Pista",
      description: "nagyon jó zenéket ír",
    };
    const { insertId: nameId } = await db
      .insertInto("names")
      .values(name)
      .executeTakeFirstOrThrow();

    const secondName: NewName = {
      fullName: "Nagy Pista",
      description: "fapofa",
    };

    const { insertId: secondNameId } = await db
      .insertInto("names")
      .values(secondName)
      .executeTakeFirstOrThrow();

    const castAndCrew: NewCastAndCrew = {
      movieId: Number(movieId),
      nameId: Number(nameId),
      role: "composer",
    };
    const { insertId: castAndCrewId } = await db
      .insertInto("castAndCrew")
      .values(castAndCrew)
      .executeTakeFirstOrThrow();

    const token = signAccessToken({
      id: Number(editorId),
      email: editor!.email,
      role: editor!.role,
    });

    const requestBody: z.infer<typeof UpdatedMovie> = {
      title: "A vak asszony mégsem néz vissza",
      releaseDate: new Date(2019, 1, 1),
      description: "nem sok fordulattal, de látványos egy vaknak",
      castAndCrew: [{ nameId: Number(secondNameId), role: "actor" }],
    };

    const response = await supertest(app)
      .put(`/movies/${movieId}`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(200);

    const checkMovieChanges = await db
      .selectFrom("movies")
      .where("id", "=", Number(movieId))
      .selectAll()
      .executeTakeFirst();

    const checkCastAndCrewChanges = await db
      .selectFrom("castAndCrew")
      .where("movieId", "=", Number(movieId))
      .selectAll()
      .executeTakeFirst();

    expect(checkMovieChanges!.description).toBe(requestBody.description);
    expect(checkMovieChanges!.releaseDate.toISOString).toBe(
      requestBody.releaseDate.toISOString
    );
    expect(checkMovieChanges!.title).toBe(requestBody.title);
    expect(checkCastAndCrewChanges!.nameId).toBe(
      requestBody.castAndCrew[0].nameId
    );
    expect(checkCastAndCrewChanges!.role).toBe(requestBody.castAndCrew[0].role);
  });
  test("it should be send back 404 because the given id not exist(movie table be empty)", async () => {
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

    const requestBody: z.infer<typeof UpdatedMovie> = {
      title: "A vak asszony mégsem nézz vissza",
      releaseDate: new Date(2019, 1, 1),
      description: "nem sok fordulattal, de látványos egy vaknak",
      castAndCrew: [{ nameId: Number(1), role: "actor" }],
    };

    const response = await supertest(app)
      .put(`/movies/1`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(404);
  });
  test("it should return 403 because user role not have the permission to update a movie", async () => {
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
      role: user!.role,
    });

    const requestBody: z.infer<typeof UpdatedMovie> = {
      title: "A vak asszony mégsem néz vissza",
      releaseDate: new Date(2019, 1, 1),
      description: "nem sok fordulattal,de látványos egy vaknak",
      castAndCrew: [{ nameId: Number(1), role: "actor" }],
    };

    const response = await supertest(app)
      .put(`/movies/1`)
      .set("Authorization", "Bearer " + token)
      .send(requestBody);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("You don't have enough permission.");
  });
});
