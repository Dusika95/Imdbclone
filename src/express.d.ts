declare namespace Express {
  export interface Request {
    user?: User;
  }
  export interface User {
    id: number;
    email: string;
    role: "user" | "editor" | "moderator" | "admin";
  }
}
