import { answerWithCopy } from "./_lib/copies.js";
import { shops } from "./_lib/itad.js";

export async function GET(): Promise<Response> {
  return answerWithCopy("shops", 24 * 60 * 60, shops);
}
