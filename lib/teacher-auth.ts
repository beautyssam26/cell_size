import { env } from "cloudflare:workers";

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

export async function isTeacherRequest(request: Request) {
  const expected = env.ADMIN_PASSWORD;
  const header = request.headers.get("Authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !supplied) return false;
  const [left, right] = await Promise.all([digest(expected), digest(supplied)]);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}
