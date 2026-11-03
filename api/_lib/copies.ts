import { waitUntil } from "@vercel/functions";
import { copyStore } from "./copy-store.js";
import { UpstreamError, cacheFor, errorResponse } from "./http.js";

const SHAPE_VERSION = 1;

export interface CopyStore {
  read(key: string): Promise<unknown>;
  save(key: string, body: unknown): Promise<void>;
}

async function savedCopy(store: CopyStore, key: string) {
  try {
    return await store.read(key);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function answerWithCopy(
  key: string,
  seconds: number,
  load: () => Promise<unknown>,
  store: CopyStore = copyStore(),
) {
  const id = `v${SHAPE_VERSION}:${key}`;
  try {
    const body = await load();
    waitUntil(store.save(id, body).catch((error) => console.error(error)));
    return Response.json(body, { headers: cacheFor(seconds) });
  } catch (error) {
    const copy = error instanceof UpstreamError && error.status !== 404 ? await savedCopy(store, id) : null;
    if (copy === null) return errorResponse(error);
    console.error(error);
    return Response.json(copy, { headers: cacheFor(60) });
  }
}
