// Local, single-process demo storage. Replace before deploying to serverless.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { LearningEvent, Session } from "../../types/contracts";
interface Store { sessions: Record<string, Session>; events: LearningEvent[] }
const root = path.join(process.cwd(), ".data");
const target = path.join(root, "demo.json");
const state = globalThis as typeof globalThis & { deskBuddyQueue?: Promise<unknown> };
export async function transaction<T>(fn: (store: Store) => T): Promise<T> {
  const task = (state.deskBuddyQueue ?? Promise.resolve()).then(async () => {
    await mkdir(root, { recursive: true });
    let store: Store;
    try { store = JSON.parse(await readFile(target, "utf8")) as Store; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; store = { sessions: {}, events: [] }; }
    const result = fn(store);
    const temporary = `${target}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(store), { mode: 0o600 });
    await rename(temporary, target);
    return result;
  });
  state.deskBuddyQueue = task.catch(() => undefined);
  return task;
}
