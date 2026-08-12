/**
 * Idempotent Firestore migration for the Home/VIP category redesign.
 *
 * Run with: npm run migrate:vip-categories
 *
 * The migration only upserts category metadata. Existing predictions remain
 * linked to their original category IDs.
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(__dirname, "../serviceAccountKey.json");

if (!fs.existsSync(keyPath)) {
  throw new Error("serviceAccountKey.json was not found in the project root.");
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(require(keyPath)),
  });
}

const db = admin.firestore();

const ACTIVE_CATEGORIES = [
  {
    id: "btts",
    title: "Free Hot Picks",
    description: "Hottest free predictions daily",
    icon: "Flame",
    isVip: false,
    isActive: true,
    order: 1,
    winRate: 80,
    matchCount: 0,
  },
  {
    id: "over25",
    title: "Daily OV/UN Tips",
    description: "Daily over and under selections",
    icon: "TrendingUp",
    isVip: false,
    isActive: true,
    order: 2,
    winRate: 75,
    matchCount: 0,
  },
  {
    id: "combined",
    title: "Combined VIP",
    description: "Our highest-conviction daily calls",
    icon: "Crown",
    isVip: true,
    isActive: true,
    order: 1,
    winRate: 0,
    matchCount: 0,
  },
  {
    id: "correct",
    title: "Titan Correct Scores",
    description: "Exact scoreline predictions",
    icon: "Trophy",
    isVip: true,
    isActive: true,
    order: 2,
    winRate: 75,
    matchCount: 0,
  },
  {
    id: "htft",
    title: "HT/FT VIP",
    description: "Half-time and full-time picks",
    icon: "Award",
    isVip: true,
    isActive: true,
    order: 3,
    winRate: 80,
    matchCount: 0,
  },
  {
    id: "vipsingle",
    title: "OV/UN Sure Tips",
    description: "Premium totals selections",
    icon: "TrendingUp",
    isVip: true,
    isActive: true,
    order: 4,
    winRate: 82,
    matchCount: 0,
  },
  {
    id: "megaodds",
    title: "Titan 10+ Odds",
    description: "Carefully combined 10+ odds",
    icon: "Crown",
    isVip: true,
    isActive: true,
    order: 5,
    winRate: 65,
    matchCount: 0,
  },
  {
    id: "draws",
    title: "Fixed Special Draws",
    description: "Selected draw predictions",
    icon: "Minus",
    isVip: true,
    isActive: true,
    order: 6,
    winRate: 72,
    matchCount: 0,
  },
  {
    id: "combo",
    title: "Special Combo",
    description: "Curated multi-leg combo selections",
    icon: "Zap",
    isVip: true,
    isActive: true,
    order: 7,
    winRate: 85,
    matchCount: 0,
  },
];

const LEGACY_CATEGORY_IDS = ["1x2", "daily2"];

async function migrate() {
  const batch = db.batch();
  const migratedAt = admin.firestore.FieldValue.serverTimestamp();

  for (const category of ACTIVE_CATEGORIES) {
    const { id, ...data } = category;
    batch.set(
      db.collection("categories").doc(id),
      { ...data, schemaVersion: 2, updatedAt: migratedAt },
      { merge: true },
    );
  }

  for (const categoryId of LEGACY_CATEGORY_IDS) {
    batch.set(
      db.collection("categories").doc(categoryId),
      { isActive: false, order: 99, schemaVersion: 2, updatedAt: migratedAt },
      { merge: true },
    );
  }

  await batch.commit();

  const snapshot = await db.collection("categories").get();
  const documents = new Map(
    snapshot.docs.map((document) => [document.id, document.data()]),
  );
  const failures = [];

  for (const expected of ACTIVE_CATEGORIES) {
    const actual = documents.get(expected.id);
    if (!actual) {
      failures.push(`${expected.id}: missing`);
      continue;
    }

    for (const [field, value] of Object.entries(expected)) {
      if (field !== "id" && actual[field] !== value) {
        failures.push(
          `${expected.id}.${field}: expected ${JSON.stringify(value)}, received ${JSON.stringify(actual[field])}`,
        );
      }
    }
  }

  const activeVipIds = ACTIVE_CATEGORIES.filter(
    (category) => category.isVip,
  ).map((category) => category.id);

  if (activeVipIds.length !== 7 || activeVipIds[0] !== "combined") {
    failures.push(`VIP topology invalid: ${activeVipIds.join(", ")}`);
  }

  if (failures.length > 0) {
    throw new Error(`Migration verification failed:\n${failures.join("\n")}`);
  }

  console.log("VIP category migration verified.");
  console.log(`Active VIP documents (${activeVipIds.length}): ${activeVipIds.join(", ")}`);
  console.log("Combined VIP is available to the admin prediction workflow.");
}

migrate()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await admin.app().delete();
  });
