import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { db } from "../../database";
import { authenticateTokenMiddleware } from "../../middlewares/authentication";
import { NameUpdate } from "../../types";

const UpdateName = z.object({
  fullName: z.string(),
  description: z.string(),
});

const requestHandler = asyncHandler(async (req: Request, res: Response) => {
  const dto = UpdateName.parse(req.body);

  const targetName = await db
    .selectFrom("names")
    .where("id", "=", parseInt(req.params.id))
    .selectAll()
    .executeTakeFirst();

  if (!targetName) {
    res
      .status(404)
      .json({ message: "this name is not exist in the collection" });

    return;
  }
  const name: NameUpdate = {
    fullName: dto.fullName,
    description: dto.description,
  };

  await db
    .updateTable("names")
    .set(name)
    .where("id", "=", parseInt(req.params.id))
    .execute();

  res.sendStatus(200);
});
export default [authenticateTokenMiddleware(["editor"]), requestHandler];
