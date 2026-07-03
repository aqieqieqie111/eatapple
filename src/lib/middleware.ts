import { NextRequest } from "next/server";
import { parseSessionToken } from "./auth";

export function getCurrentUserId(req: NextRequest): string | null {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  const session = parseSessionToken(token);
  return session?.userId ?? null;
}
