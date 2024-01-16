import { pbkdf2Sync, randomBytes } from "crypto";
import { sign } from "jsonwebtoken";
import { Role } from "../types";
import { verify } from "jsonwebtoken";

export interface UserInfo {
  id: number;
  email: string;
  role: Role;
}

type TokenResponse =
  | {
      status: "success";
      data: UserInfo;
    }
  | {
      status: "error";
      error: string;
    };

export function verifyAccessToken(token: string): TokenResponse {
  const secret = process.env.TOKEN_SECRET!.toString();

  try {
    const decoded = verify(token, secret);
    return { status: "success", data: decoded as UserInfo };
  } catch (error: any) {
    return { status: "error", error: error.message };
  }
}

export function hashPassword(salt: string, password: string): string {
  return pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("base64");
}

export function signAccessToken(user: {
  id: number;
  email: string;
  role: Role;
}) {
  const secret = process.env.TOKEN_SECRET!.toString();

  const payload: UserInfo = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = sign(payload, secret, {
    expiresIn: "1h",
  });

  return token;
}
