import { db } from "../database";

export default async function updateMovieRatings(movieId: number) {
  const movieRatings = await db
    .selectFrom("ratings")
    .where("movieId", "=", movieId)
    .select(["score"])
    .execute();

  let sumScore = movieRatings.reduce((accumulator, currentValue) => {
    return accumulator + currentValue.score;
  }, 0);

  await db
    .updateTable("movies")
    .set({ rating: sumScore / movieRatings.length || 0 })
    .where("id", "=", movieId)
    .execute();
}
