// src/lib/proctorStore.ts
// super-light IndexedDB wrapper for counters + snapshots

const DB_NAME = "proctorDB";
const DB_VERSION = 2; // bump to 2 to support history
const STORE_METRICS = "metrics";
const STORE_SNAPSHOTS = "snapshots";
const METRICS_KEY = "state";
const SNAP_LIST_KEY = "list";

type MinuteBucket = { start: number; away: number; speech: number };

type MetricsState = {
  minuteStart: number;
  minute: { away: number; speech: number };
  totals: {
    multiFace: number;
    noFace: number;
    /** NEW: session-wide counts by object class */
    forbiddenObjects: Record<string, number>;
  };
  history: MinuteBucket[];
};


function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_METRICS)) {
        db.createObjectStore(STORE_METRICS);
      }
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T = any>(
  store: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    run(s).then(resolve).catch(reject);
    t.oncomplete = () => db.close();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

function startOfMinute(now = Date.now()) {
  return now - (now % 60000);
}

async function getMetricsState(): Promise<MetricsState> {
  return tx(STORE_METRICS, "readonly", async (s) => {
    const val = await new Promise<MetricsState | undefined>((res, rej) => {
      const r = s.get(METRICS_KEY);
      r.onsuccess = () => res(r.result as MetricsState | undefined);
      r.onerror = () => rej(r.error);
    });

    if (val) {
      let migrated = false;

      if (!Array.isArray((val as any).history)) {
        (val as any).history = [];
        migrated = true;
      }
      if (!(val as any).totals) {
        (val as any).totals = { multiFace: 0, noFace: 0, forbiddenObjects: {} };
        migrated = true;
      } else if (!(val as any).totals.forbiddenObjects) {
        (val as any).totals.forbiddenObjects = {};
        migrated = true;
      }

      if (migrated) await setMetricsState(val as MetricsState);
      return val as MetricsState;
    }

    const init: MetricsState = {
      minuteStart: startOfMinute(),
      minute: { away: 0, speech: 0 },
      totals: { multiFace: 0, noFace: 0, forbiddenObjects: {} },
      history: [],
    };
    await setMetricsState(init);
    return init;
  });
}


async function setMetricsState(state: MetricsState): Promise<void> {
  return tx(STORE_METRICS, "readwrite", async (s) => {
    await new Promise<void>((res, rej) => {
      const r = s.put(state, METRICS_KEY);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  });
}

/**
 * Ensure the state is on the current minute.
 * If minute advanced by N minutes, push the previous bucket(s) into history,
 * including zero buckets for skipped, then reset current minute counters.
 */
async function rolloverIfNeeded(state?: MetricsState): Promise<MetricsState> {
  const st = state ?? (await getMetricsState());
  const nowBucket = startOfMinute();
  const MINUTE_MS = 60000;

  while (st.minuteStart < nowBucket) {
    // push the finished/previous bucket to history
    st.history.push({
      start: st.minuteStart,
      away: st.minute.away,
      speech: st.minute.speech,
    });

    // advance one minute and reset counters
    st.minuteStart += MINUTE_MS;
    st.minute = { away: 0, speech: 0 };
  }

  await setMetricsState(st);
  return st;
}

/** Force record of the *current* minute snapshot in history (idempotent). */
async function flushCurrentMinute(): Promise<void> {
  const st = await rolloverIfNeeded();
  const last = st.history[st.history.length - 1];
  if (!last || last.start !== st.minuteStart) {
    st.history.push({
      start: st.minuteStart,
      away: st.minute.away,
      speech: st.minute.speech,
    });
  } else {
    // update last with most recent counts (no duplicate)
    last.away = st.minute.away;
    last.speech = st.minute.speech;
  }
  await setMetricsState(st);
}

export async function incLookingAway() {
  const st = await rolloverIfNeeded();
  st.minute.away += 1;
  await setMetricsState(st);
}
export async function incSpeechStarted() {
  const st = await rolloverIfNeeded();
  st.minute.speech += 1;
  await setMetricsState(st);
}
export async function incMultiFace() {
  const st = await rolloverIfNeeded();
  st.totals.multiFace += 1;
  await setMetricsState(st);
}
export async function incNoFace() {
  const st = await rolloverIfNeeded();
  st.totals.noFace += 1;
  await setMetricsState(st);
}

export async function getMinuteCounts() {
  const st = await rolloverIfNeeded();
  return { minuteStart: st.minuteStart, ...st.minute };
}
export async function getTotals() {
  const st = await rolloverIfNeeded();
  return { ...st.totals };
}

/** NEW: full history (includes current minute snapshot) */
export async function getAllMetrics() {
  await flushCurrentMinute(); // make sure the current minute is represented
  const st = await getMetricsState();
  return { minutes: st.history.slice(), totals: st.totals };
}

/* snapshots (string[] of URLs) */
async function getSnapshotList(): Promise<string[]> {
  return tx(STORE_SNAPSHOTS, "readonly", async (s) => {
    const val = await new Promise<string[] | undefined>((res, rej) => {
      const r = s.get(SNAP_LIST_KEY);
      r.onsuccess = () => res((r.result as string[]) || undefined);
      r.onerror = () => rej(r.error);
    });
    return val ?? [];
  });
}

export async function addSnapshotUrl(url: string) {
  const list = await getSnapshotList();
  list.push(url);
  await tx(STORE_SNAPSHOTS, "readwrite", async (s) => {
    await new Promise<void>((res, rej) => {
      const r = s.put(list, SNAP_LIST_KEY);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  });
}

export async function getSnapshots(): Promise<string[]> {
  return getSnapshotList();
}

export async function clearProctorStores() {
  await tx(STORE_METRICS, "readwrite", async (s) => {
    await new Promise<void>((res, rej) => {
      const r = s.delete(METRICS_KEY);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  }).catch(() => {});
  await tx(STORE_SNAPSHOTS, "readwrite", async (s) => {
    await new Promise<void>((res, rej) => {
      const r = s.delete(SNAP_LIST_KEY);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  }).catch(() => {});
}

export async function incForbiddenObject(cls: string) {
  const st = await rolloverIfNeeded();
  st.totals = st.totals ?? { multiFace: 0, noFace: 0, forbiddenObjects: {} };
  st.totals.forbiddenObjects = st.totals.forbiddenObjects ?? {};
  st.totals.forbiddenObjects[cls] =
    (st.totals.forbiddenObjects[cls] ?? 0) + 1;
  await setMetricsState(st);
}

