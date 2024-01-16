import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { loggingMiddleware } from "./middlewares/logging";
import login from "./endpoints/login";
import signUp from "./endpoints/signUp";
import createInternalMember from "./endpoints/users/createInternalMember";
import createReview from "./endpoints/review/createReview";
import createRating from "./endpoints/rating/createRating";
import createName from "./endpoints/names/createName";
import getAllMovies from "./endpoints/movies/getAllMovies";
import getMovieDetails from "./endpoints/movies/getMovieDetails";
import createMovie from "./endpoints/movies/createMovie";
import updateProfile from "./endpoints/updateProfile";
import deleteUser from "./endpoints/users/deleteUser";
import getReviews from "./endpoints/review/getReviews";
import deleteReview from "./endpoints/review/deleteReview";
import deleteRating from "./endpoints/rating/deleteRating";
import updateName from "./endpoints/names/updateName";
import updateMovie from "./endpoints/movies/updateMovie";
import deleteProfile from "./endpoints/deleteProfile";
import updateReview from "./endpoints/review/updateReview";
import updateRating from "./endpoints/rating/updateRating";
import search from "./endpoints/search";
import getNameDetails from "./endpoints/names/getNameDetails";
import { errorHandlerMiddleware } from "./middlewares/errorHandler";

const app = express();

app.use(loggingMiddleware);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.post("/signup", signUp);
app.post("/login", login);
app.put("/profile", updateProfile);
app.delete("/profile", deleteProfile);
app.get("/search", search);

app.post("/users", createInternalMember);
app.delete("/users/:id", deleteUser);

app.get("/reviews", getReviews);
app.post("/reviews", createReview);
app.put("/reviews/:id", updateReview);
app.delete("/reviews/:id", deleteReview);

app.post("/ratings", createRating);
app.delete("/ratings/:id", deleteRating);
app.put("/ratings/:id", updateRating);

app.get("/names/:id", getNameDetails);
app.post("/names", createName);
app.put("/names/:id", updateName);

app.get("/movies", getAllMovies);
app.get("/movies/:id", getMovieDetails);
app.post("/movies", createMovie);
app.put("/movies/:id", updateMovie);

app.use(errorHandlerMiddleware);

export default app;
