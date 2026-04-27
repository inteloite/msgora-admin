import Redis from 'ioredis';

const redis = new Redis(process.env.msgora_REDIS_URL, { tls: { rejectUnauthorized: false } });

// ── Helpers ───────────────────────────────────────────────────────────────────

async function get(key) {
    const val = await redis.get(key);
    if (val === null) return null;
    try { return JSON.parse(val); } catch { return val; }
}

async function set(key, value) {
    await redis.set(key, JSON.stringify(value));
}

async function del(key) {
    await redis.del(key);
}

async function sadd(key, ...members) {
    await redis.sadd(key, ...members);
}

async function srem(key, ...members) {
    await redis.srem(key, ...members);
}

async function smembers(key) {
    return redis.smembers(key);
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAdmin(id) {
    return get(`admin:${id}`);
}

export async function getAdminByUsername(username) {
    const id = await get(`admin:u:${username.toLowerCase()}`);
    if (!id) return null;
    return get(`admin:${id}`);
}

export async function saveAdmin(admin) {
    await set(`admin:${admin.id}`, admin);
    await set(`admin:u:${admin.username.toLowerCase()}`, admin.id);
    await sadd('admins', admin.id);
}

export async function listAdmins() {
    const ids = await smembers('admins');
    if (!ids || !ids.length) return [];
    const rows = await Promise.all(ids.map(id => get(`admin:${id}`)));
    return rows.filter(Boolean);
}

// ── Licenses ──────────────────────────────────────────────────────────────────

export async function getLicense(key) {
    return get(`license:${key.toUpperCase()}`);
}

export async function saveLicense(license) {
    const k = license.key.toUpperCase();
    await set(`license:${k}`, license);
    await sadd('licenses', k);
}

export async function listAllLicenses() {
    const keys = await smembers('licenses');
    if (!keys || !keys.length) return [];
    const rows = await Promise.all(keys.map(k => get(`license:${k}`)));
    return rows.filter(Boolean);
}

export async function deleteLicense(license) {
    const k = license.key.toUpperCase();
    await Promise.all([
        del(`license:${k}`),
        srem('licenses', k),
    ]);
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function getExpense(id) {
    return get(`expense:${id}`);
}

export async function saveExpense(expense) {
    await set(`expense:${expense.id}`, expense);
    await sadd('expenses', expense.id);
}

export async function listAllExpenses() {
    const ids = await smembers('expenses');
    if (!ids || !ids.length) return [];
    const rows = await Promise.all(ids.map(id => get(`expense:${id}`)));
    return rows.filter(Boolean);
}
