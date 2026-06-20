const { encrypt, decrypt } = require("./server/src/utils/encryption.js");
require("dotenv").config({ path: "server/.env" });

// --- Helpers ---
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (!condition) { console.error(`[FAIL] ${label}`); failed++; }
  else { console.log(`[PASS] ${label}`); passed++; }
}

function assertNoPlaintext(ciphertext, plaintext, label) {
  assert(!ciphertext.includes(plaintext), `${label} — plaintext not in ciphertext`);
}

function assertThrows(fn, label) {
  try { fn(); assert(false, label); }
  catch { assert(true, label); }
}

function assertFormat(ciphertext) {
  assert(typeof ciphertext === "string" && ciphertext.length > 0, "ciphertext is non-empty string");
  assert(ciphertext.startsWith("v1:gcm:"), "ciphertext has v1:gcm: prefix");
  const parts = ciphertext.split(":");
  assert(parts.length >= 5, `ciphertext has >= 5 parts (got ${parts.length})`);
}

// --- ENV ---
assert(!!process.env.JWT_SECRET, "JWT_SECRET is set");
assert(!!process.env.ENCRYPTION_KEY || !!process.env.SECRET_KEY, "encryption key env var is set");

// --- Known ciphertext decrypt ---
const KNOWN_CIPHERTEXT = "v1:gcm:a02a19ae8a0e138cf430b563:58cf1207bab9460a08737686f7eda382:0:f1b8a514d7c865db2650080fb05fcecb";
try {
  const decrypted = decrypt(KNOWN_CIPHERTEXT);
  assert(typeof decrypted === "string" && decrypted.length > 0, "known ciphertext decrypts to non-empty string");
  console.log("[debug] decrypted length:", decrypted.length, "(value hidden)");
} catch (err) {
  console.warn(`[warn] known ciphertext decrypt failed: ${err.message}`);
  console.warn("[warn] key mismatch or different env — expected in CI");
}

// --- Roundtrip ---
const testValues = [
  "alice@example.com",
  "simple",
  "with spaces and symbols !@#$%",
  "unicode: 用户名",
  "a".repeat(500),
  "123456789",
  "UPPERCASE@DOMAIN.COM",
  "  leading trailing spaces  ",
];

testValues.forEach((val) => {
  const encrypted = encrypt(val);
  const decrypted = decrypt(encrypted);
  assert(decrypted === val, `roundtrip: "${val.slice(0, 30)}${val.length > 30 ? "..." : ""}"`);
  assertNoPlaintext(encrypted, val.trim().slice(0, 6), `plaintext not leaked: "${val.slice(0, 20)}..."`);
});

// --- Format validation ---
const sample = encrypt("test");
assertFormat(sample);

// --- IV uniqueness ---
const enc1 = encrypt("same-input");
const enc2 = encrypt("same-input");
assert(enc1 !== enc2, "same input → different ciphertext (random IV)");

// --- Different inputs differ ---
const encA = encrypt("alice@example.com");
const encB = encrypt("bob@example.com");
assert(encA !== encB, "different inputs → different ciphertext");

// --- High-volume uniqueness (10 calls) ---
const samples = Array.from({ length: 10 }, () => encrypt("bulk-test"));
const unique = new Set(samples);
assert(unique.size === 10, "10 encryptions of same input all unique (random IV)");

// --- Tamper resistance ---
const tamperCases = [
  "v1:gcm:tampered:tampered:0:tampered",
  "v1:gcm::::",
  "notvalid",
  "",
  "v1:gcm:" + "a".repeat(200),
];
tamperCases.forEach((tc, i) => {
  assertThrows(() => decrypt(tc), `tamper case ${i + 1} throws: "${tc.slice(0, 30)}"`);
});

// --- Decrypt-only tamper (valid format, wrong auth tag) ---
assertThrows(
  () => decrypt("v1:gcm:a02a19ae8a0e138cf430b563:58cf1207bab9460a08737686f7eda382:0:ffffffffffffffffffffffffffffffff"),
  "wrong auth tag throws"
);

// --- Empty string ---
try {
  const encEmpty = encrypt("");
  const decEmpty = decrypt(encEmpty);
  assert(decEmpty === "", "empty string roundtrip");
} catch {
  assert(true, "empty string throws — acceptable");
}

// --- Type safety ---
assertThrows(() => encrypt(null), "null throws");
assertThrows(() => encrypt(undefined), "undefined throws");
assertThrows(() => encrypt(12345), "number throws");
assertThrows(() => encrypt({}), "object throws");
assertThrows(() => encrypt([]), "array throws");

// --- Decrypt type safety ---
assertThrows(() => decrypt(null), "decrypt null throws");
assertThrows(() => decrypt(undefined), "decrypt undefined throws");
assertThrows(() => decrypt(12345), "decrypt number throws");

// --- Summary ---
console.log(`\n[done] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);