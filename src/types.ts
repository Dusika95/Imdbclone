import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

export interface Database {
  users: UserTable;
  movies: MovieTable;
  ratings: RatingTable;
  reviews: ReviewTable;
  names: NameTable;
  castAndCrew: CastAndCrewTable;
}
export type Role = "user" | "editor" | "moderator" | "admin";
export interface UserTable {
  id: Generated<number>;
  nickName: string;
  email: string;
  role: Role;
  passwordHash: string;
  salt: string;
}

export interface MovieTable {
  id: Generated<number>;
  title: string;
  rating: number;
  releaseDate: ColumnType<Date>;
  description: string;
}

export interface RatingTable {
  id: Generated<number>;
  score: number;
  userId: number;
  movieId: number;
  reviewId?: number;
}

export interface ReviewTable {
  id: Generated<number>;
  text: string;
  userId: number;
  movieId: number;
  title: string;
  hasSpoiler: boolean;
}

export interface NameTable {
  id: Generated<number>;
  fullName: string;
  description: string;
}

export type MovieRole = "actor" | "director" | "writer" | "composer";
export interface CastAndCrewTable {
  id: Generated<number>;
  movieId: number;
  nameId: number;
  role: MovieRole;
}

export type Users = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export type Movies = Selectable<MovieTable>;
export type NewMovie = Insertable<MovieTable>;
export type MovieUpdate = Updateable<MovieTable>;

export type Ratings = Selectable<RatingTable>;
export type NewRating = Insertable<RatingTable>;
export type RatingUpdate = Updateable<RatingTable>;

export type Reviews = Selectable<ReviewTable>;
export type NewReview = Insertable<ReviewTable>;
export type ReviewUpdate = Updateable<ReviewTable>;

export type Name = Selectable<NameTable>;
export type NewName = Insertable<NameTable>;
export type NameUpdate = Updateable<NameTable>;

export type CastAndCrews = Selectable<CastAndCrewTable>;
export type NewCastAndCrew = Insertable<CastAndCrewTable>;
export type CastAndCrewUpdate = Updateable<CastAndCrewTable>;
