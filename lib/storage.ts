// node:fs is imported lazily inside the local-dev paths only, so the
// Cloudflare Worker bundle never pulls in a filesystem it does not have.
const nodeFs = async () => (await import("node:fs")).default;
const nodePath = async () => (await import("node:path")).default;

// Storage layer with two drivers:
//  - Supabase (Postgres) when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
//    set — used in production on Vercel, where the filesystem is ephemeral.
//    Single table `store` (bucket, key, value jsonb) — see supabase/schema.sql.
//  - Local JSON files under data/ otherwise — used in dev, zero setup.
// Server-only: the service-role key must never reach the client bundle.


const useSupabase = () =>
  !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

let _client: import("@supabase/supabase-js").SupabaseClient | null = null;
async function supabase() {
  if (!_client) {
    const { createClient } = await import("@supabase/supabase-js");
    _client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return _client;
}

const TABLE = "store";
const KV_BUCKET = "kv";

function fail(op: string, error: { message?: string } | null): never {
  throw new Error(
    `Supabase ${op} failed: ${error?.message ?? "unknown"} — has supabase/schema.sql been run?`
  );
}

/* ── local file driver ── */

const fileFor = async (key: string) => {
  const path = await nodePath();
  return path.join(process.cwd(), "data", `${key.replace(/[^a-z0-9-]/gi, "_")}.json`);
};

export async function fsRead<T>(key: string): Promise<T | null> {
  try {
    const fs = await nodeFs();
    return JSON.parse(fs.readFileSync(await fileFor(key), "utf8")) as T;
  } catch {
    return null;
  }
}

async function fsWrite(key: string, value: unknown): Promise<void> {
  // Serverless filesystems are read-only, so reaching here in production
  // means Supabase isn't configured. Say so plainly rather than surfacing
  // a confusing EROFS from deep inside a write.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        "in the host's environment variables. This host has a read-only " +
        "filesystem, so orders and settings cannot be saved without it."
    );
  }
  const fs = await nodeFs();
  const path = await nodePath();
  const file = await fileFor(key);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 1));
}

/* ── single JSON documents (settings, admin auth) ── */

export async function kvGet<T>(key: string): Promise<T | null> {
  if (useSupabase()) {
    const db = await supabase();
    const { data, error } = await db
      .from(TABLE)
      .select("value")
      .eq("bucket", KV_BUCKET)
      .eq("key", key)
      .maybeSingle();
    if (error) fail(`get ${key}`, error);
    return (data?.value as T) ?? null;
  }
  return await fsRead<T>(key);
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  if (useSupabase()) {
    const db = await supabase();
    const { error } = await db
      .from(TABLE)
      .upsert({ bucket: KV_BUCKET, key, value }, { onConflict: "bucket,key" });
    if (error) fail(`set ${key}`, error);
    return;
  }
  await fsWrite(key, value);
}

/* ── hash maps (orders by id, subscribers by email) ── */

export async function hashGetAll<T>(hash: string): Promise<Record<string, T>> {
  if (useSupabase()) {
    const db = await supabase();
    const { data, error } = await db
      .from(TABLE)
      .select("key,value")
      .eq("bucket", hash);
    if (error) fail(`list ${hash}`, error);
    const map: Record<string, T> = {};
    for (const row of data ?? []) map[row.key as string] = row.value as T;
    return map;
  }
  const raw = await fsRead<unknown>(hash);
  if (Array.isArray(raw)) {
    // legacy array files (early dev data) — convert to a map
    const map: Record<string, T> = {};
    for (const item of raw as (T & { id?: string; email?: string })[]) {
      const k = item.id ?? item.email ?? String(Object.keys(map).length);
      map[k] = item;
    }
    return map;
  }
  return (raw as Record<string, T>) ?? {};
}

export async function hashSet(hash: string, field: string, value: unknown): Promise<void> {
  if (useSupabase()) {
    const db = await supabase();
    const { error } = await db
      .from(TABLE)
      .upsert({ bucket: hash, key: field, value }, { onConflict: "bucket,key" });
    if (error) fail(`set ${hash}/${field}`, error);
    return;
  }
  const map = await hashGetAll<unknown>(hash);
  map[field] = value;
  await fsWrite(hash, map);
}

export async function hashDelete(hash: string, field: string): Promise<void> {
  if (useSupabase()) {
    const db = await supabase();
    const { error } = await db
      .from(TABLE)
      .delete()
      .eq("bucket", hash)
      .eq("key", field);
    if (error) fail(`delete ${hash}/${field}`, error);
    return;
  }
  const map = await hashGetAll<unknown>(hash);
  delete map[field];
  await fsWrite(hash, map);
}

export async function hashHas(hash: string, field: string): Promise<boolean> {
  if (useSupabase()) {
    const db = await supabase();
    const { count, error } = await db
      .from(TABLE)
      .select("key", { count: "exact", head: true })
      .eq("bucket", hash)
      .eq("key", field);
    if (error) fail(`has ${hash}/${field}`, error);
    return (count ?? 0) > 0;
  }
  const map = await hashGetAll<unknown>(hash);
  return field in map;
}

export async function hashCount(hash: string): Promise<number> {
  if (useSupabase()) {
    const db = await supabase();
    const { count, error } = await db
      .from(TABLE)
      .select("key", { count: "exact", head: true })
      .eq("bucket", hash);
    if (error) fail(`count ${hash}`, error);
    return count ?? 0;
  }
  return Object.keys(await hashGetAll<unknown>(hash)).length;
}
