/**
 * Firestore Seed Script — Titan Football Tips
 *
 * SETUP BEFORE RUNNING:
 *  1. Go to Firebase Console → Project Settings → Service Accounts
 *  2. Click "Generate new private key" → save as serviceAccountKey.json
 *     in the ROOT of this project (next to package.json)
 *  3. Run:  npm run seed
 *
 * WARNING: serviceAccountKey.json is already in .gitignore — never commit it.
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// ─── Load service account ────────────────────────────────────────────────────
const keyPath = path.join(__dirname, "../serviceAccountKey.json");

if (!fs.existsSync(keyPath)) {
  console.error("\n❌  serviceAccountKey.json not found.");
  console.error(
    "    Download it from Firebase Console → Project Settings → Service Accounts\n",
  );
  process.exit(1);
}

const serviceAccount = require(keyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ─── Data ────────────────────────────────────────────────────────────────────

const categories = [
  // Free
  {
    id: "btts",
    title: "BTTS Tips",
    description: "Both Teams to Score",
    icon: "Goal",
    isVip: false,
    matchCount: 8,
    winRate: 78,
    order: 1,
  },
  {
    id: "over25",
    title: "Over 2.5",
    description: "Over 2.5 Goals",
    icon: "TrendingUp",
    isVip: false,
    matchCount: 12,
    winRate: 82,
    order: 2,
  },
  {
    id: "1x2",
    title: "1X2 Tips",
    description: "Match Winner",
    icon: "Target",
    isVip: false,
    matchCount: 15,
    winRate: 71,
    order: 3,
  },
  {
    id: "draws",
    title: "Draw Tips",
    description: "Draw Predictions",
    icon: "Percent",
    isVip: false,
    matchCount: 6,
    winRate: 65,
    order: 4,
  },
  // VIP
  {
    id: "htft",
    title: "HT/FT Tips",
    description: "Halftime/Fulltime",
    icon: "Trophy",
    isVip: true,
    matchCount: 5,
    winRate: 89,
    order: 1,
  },
  {
    id: "combo",
    title: "Combo Tips",
    description: "Accumulator Bets",
    icon: "Zap",
    isVip: true,
    matchCount: 3,
    winRate: 85,
    order: 2,
  },
  {
    id: "megaodds",
    title: "Mega Odds",
    description: "High Value Tips",
    icon: "Crown",
    isVip: true,
    matchCount: 4,
    winRate: 76,
    order: 3,
  },
  {
    id: "correct",
    title: "Correct Score",
    description: "Exact Score Predictions",
    icon: "Star",
    isVip: true,
    matchCount: 6,
    winRate: 68,
    order: 4,
  },
  {
    id: "daily2",
    title: "Daily 2 Odds",
    description: "Sure 2 Odds Daily",
    icon: "Flame",
    isVip: true,
    matchCount: 2,
    winRate: 94,
    order: 5,
  },
  {
    id: "vipsingle",
    title: "VIP Singles",
    description: "Premium Single Tips",
    icon: "Award",
    isVip: true,
    matchCount: 8,
    winRate: 88,
    order: 6,
  },
];

const matches = [
  // BTTS
  {
    id: "m1",
    categoryId: "btts",
    league: "Premier League",
    homeTeam: "Manchester United",
    awayTeam: "Liverpool",
    prediction: "BTTS - Yes",
    odds: "1.72",
    status: "won",
    date: "2026-03-02",
    time: "15:00",
    score: "2-2",
  },
  {
    id: "m2",
    categoryId: "btts",
    league: "La Liga",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    prediction: "BTTS - Yes",
    odds: "1.65",
    status: "won",
    date: "2026-03-02",
    time: "20:00",
    score: "3-2",
  },
  {
    id: "m3",
    categoryId: "btts",
    league: "Serie A",
    homeTeam: "AC Milan",
    awayTeam: "Inter Milan",
    prediction: "BTTS - Yes",
    odds: "1.80",
    status: "pending",
    date: "2026-03-10",
    time: "18:45",
  },
  {
    id: "m4",
    categoryId: "btts",
    league: "Bundesliga",
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    prediction: "BTTS - Yes",
    odds: "1.55",
    status: "lost",
    date: "2026-03-01",
    time: "17:30",
    score: "3-0",
  },
  // Over 2.5
  {
    id: "m5",
    categoryId: "over25",
    league: "Premier League",
    homeTeam: "Manchester City",
    awayTeam: "Arsenal",
    prediction: "Over 2.5",
    odds: "1.75",
    status: "won",
    date: "2026-03-02",
    time: "16:30",
    score: "2-2",
  },
  {
    id: "m6",
    categoryId: "over25",
    league: "Ligue 1",
    homeTeam: "PSG",
    awayTeam: "Lyon",
    prediction: "Over 2.5",
    odds: "1.60",
    status: "won",
    date: "2026-03-02",
    time: "21:00",
    score: "4-1",
  },
  {
    id: "m7",
    categoryId: "over25",
    league: "Champions League",
    homeTeam: "Chelsea",
    awayTeam: "Juventus",
    prediction: "Over 2.5",
    odds: "1.90",
    status: "pending",
    date: "2026-03-10",
    time: "20:00",
  },
  {
    id: "m8",
    categoryId: "over25",
    league: "Europa League",
    homeTeam: "Sevilla",
    awayTeam: "Roma",
    prediction: "Over 2.5",
    odds: "1.85",
    status: "pending",
    date: "2026-03-10",
    time: "18:00",
  },
  // 1X2
  {
    id: "m9",
    categoryId: "1x2",
    league: "Premier League",
    homeTeam: "Tottenham",
    awayTeam: "Newcastle",
    prediction: "Home Win (1)",
    odds: "2.10",
    status: "won",
    date: "2026-03-02",
    time: "14:00",
    score: "2-1",
  },
  {
    id: "m10",
    categoryId: "1x2",
    league: "La Liga",
    homeTeam: "Atletico Madrid",
    awayTeam: "Villarreal",
    prediction: "Home Win (1)",
    odds: "1.85",
    status: "pending",
    date: "2026-03-10",
    time: "19:00",
  },
  {
    id: "m11",
    categoryId: "1x2",
    league: "Bundesliga",
    homeTeam: "Leverkusen",
    awayTeam: "Leipzig",
    prediction: "Away Win (2)",
    odds: "2.40",
    status: "lost",
    date: "2026-03-01",
    time: "15:30",
    score: "2-0",
  },
  {
    id: "m12",
    categoryId: "1x2",
    league: "Serie A",
    homeTeam: "Napoli",
    awayTeam: "Lazio",
    prediction: "Home Win (1)",
    odds: "1.95",
    status: "won",
    date: "2026-03-02",
    time: "17:00",
    score: "3-1",
  },
  // Draws
  {
    id: "m13",
    categoryId: "draws",
    league: "Premier League",
    homeTeam: "Brighton",
    awayTeam: "Aston Villa",
    prediction: "Draw (X)",
    odds: "3.40",
    status: "won",
    date: "2026-03-02",
    time: "15:00",
    score: "1-1",
  },
  {
    id: "m14",
    categoryId: "draws",
    league: "La Liga",
    homeTeam: "Real Sociedad",
    awayTeam: "Athletic Bilbao",
    prediction: "Draw (X)",
    odds: "3.20",
    status: "pending",
    date: "2026-03-10",
    time: "21:00",
  },
  // VIP - HT/FT
  {
    id: "m15",
    categoryId: "htft",
    league: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "West Ham",
    prediction: "1/1",
    odds: "2.20",
    status: "won",
    date: "2026-03-02",
    time: "15:00",
    score: "3-0",
  },
  {
    id: "m16",
    categoryId: "htft",
    league: "Champions League",
    homeTeam: "Real Madrid",
    awayTeam: "Man City",
    prediction: "1/1",
    odds: "2.80",
    status: "pending",
    date: "2026-03-10",
    time: "21:00",
  },
  // VIP - Combo
  {
    id: "m17",
    categoryId: "combo",
    league: "Combo",
    homeTeam: "5-Fold Accumulator",
    awayTeam: "Mixed Leagues",
    prediction: "All Wins",
    odds: "12.50",
    status: "won",
    date: "2026-03-02",
    time: "Various",
    score: "5/5 ✓",
  },
  {
    id: "m18",
    categoryId: "combo",
    league: "Combo",
    homeTeam: "3-Fold BTTS",
    awayTeam: "Top Leagues",
    prediction: "All BTTS",
    odds: "4.80",
    status: "pending",
    date: "2026-03-10",
    time: "Various",
  },
  // VIP - Mega Odds
  {
    id: "m19",
    categoryId: "megaodds",
    league: "Championship",
    homeTeam: "Leeds United",
    awayTeam: "Leicester",
    prediction: "Correct Score 2-1",
    odds: "8.50",
    status: "won",
    date: "2026-03-02",
    time: "12:30",
    score: "2-1",
  },
  {
    id: "m20",
    categoryId: "megaodds",
    league: "Serie A",
    homeTeam: "Roma",
    awayTeam: "Fiorentina",
    prediction: "HT/FT Draw/Away",
    odds: "15.00",
    status: "pending",
    date: "2026-03-10",
    time: "20:45",
  },
  // VIP - Correct Score
  {
    id: "m21",
    categoryId: "correct",
    league: "Premier League",
    homeTeam: "Wolves",
    awayTeam: "Crystal Palace",
    prediction: "1-1",
    odds: "6.50",
    status: "won",
    date: "2026-03-02",
    time: "15:00",
    score: "1-1",
  },
  {
    id: "m22",
    categoryId: "correct",
    league: "La Liga",
    homeTeam: "Valencia",
    awayTeam: "Getafe",
    prediction: "2-0",
    odds: "7.00",
    status: "pending",
    date: "2026-03-10",
    time: "18:30",
  },
  // VIP - Daily 2 Odds
  {
    id: "m23",
    categoryId: "daily2",
    league: "Multiple",
    homeTeam: "Daily Sure Bet",
    awayTeam: "2 Odds Target",
    prediction: "Accumulator",
    odds: "2.05",
    status: "won",
    date: "2026-03-02",
    time: "20:00",
    score: "✓ Won",
  },
  // VIP Singles
  {
    id: "m24",
    categoryId: "vipsingle",
    league: "Serie A",
    homeTeam: "Juventus",
    awayTeam: "Atalanta",
    prediction: "Under 3.5",
    odds: "1.45",
    status: "won",
    date: "2026-03-02",
    time: "20:45",
    score: "1-0",
  },
  {
    id: "m25",
    categoryId: "vipsingle",
    league: "Bundesliga",
    homeTeam: "Frankfurt",
    awayTeam: "Wolfsburg",
    prediction: "Home or Draw",
    odds: "1.30",
    status: "pending",
    date: "2026-03-10",
    time: "17:30",
  },
];

const wonPredictions = [
  {
    id: "w1",
    homeTeam: "Man United",
    awayTeam: "Liverpool",
    prediction: "BTTS Yes",
    odds: "1.72",
    score: "2-2",
    league: "EPL",
    isVip: false,
    wonAt: new Date("2026-03-02T15:00:00Z"),
  },
  {
    id: "w2",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    prediction: "BTTS Yes",
    odds: "1.65",
    score: "3-2",
    league: "La Liga",
    isVip: false,
    wonAt: new Date("2026-03-02T20:00:00Z"),
  },
  {
    id: "w3",
    homeTeam: "PSG",
    awayTeam: "Lyon",
    prediction: "Over 2.5",
    odds: "1.60",
    score: "4-1",
    league: "Ligue 1",
    isVip: false,
    wonAt: new Date("2026-03-02T21:00:00Z"),
  },
  {
    id: "w4",
    homeTeam: "Arsenal",
    awayTeam: "West Ham",
    prediction: "HT/FT 1/1",
    odds: "2.20",
    score: "3-0",
    league: "EPL",
    isVip: true,
    wonAt: new Date("2026-03-02T15:00:00Z"),
  },
  {
    id: "w5",
    homeTeam: "Leeds",
    awayTeam: "Leicester",
    prediction: "CS 2-1",
    odds: "8.50",
    score: "2-1",
    league: "Championship",
    isVip: true,
    wonAt: new Date("2026-03-02T12:30:00Z"),
  },
  {
    id: "w6",
    homeTeam: "Napoli",
    awayTeam: "Lazio",
    prediction: "Home Win",
    odds: "1.95",
    score: "3-1",
    league: "Serie A",
    isVip: false,
    wonAt: new Date("2026-03-02T17:00:00Z"),
  },
  {
    id: "w7",
    homeTeam: "Brighton",
    awayTeam: "Aston Villa",
    prediction: "Draw",
    odds: "3.40",
    score: "1-1",
    league: "EPL",
    isVip: false,
    wonAt: new Date("2026-03-02T15:00:00Z"),
  },
  {
    id: "w8",
    homeTeam: "5-Fold Combo",
    awayTeam: "Accumulator",
    prediction: "All Wins",
    odds: "12.50",
    score: "5/5 ✓",
    league: "Mixed",
    isVip: true,
    wonAt: new Date("2026-03-02T20:00:00Z"),
  },
  {
    id: "w9",
    homeTeam: "Wolves",
    awayTeam: "Crystal Palace",
    prediction: "CS 1-1",
    odds: "6.50",
    score: "1-1",
    league: "EPL",
    isVip: true,
    wonAt: new Date("2026-03-02T15:00:00Z"),
  },
  {
    id: "w10",
    homeTeam: "Juventus",
    awayTeam: "Atalanta",
    prediction: "Under 3.5",
    odds: "1.45",
    score: "1-0",
    league: "Serie A",
    isVip: false,
    wonAt: new Date("2026-03-02T20:45:00Z"),
  },
];

// ─── Seeder ──────────────────────────────────────────────────────────────────

async function seedCollection(collectionName, data) {
  const col = db.collection(collectionName);
  let count = 0;
  for (const item of data) {
    const { id, ...fields } = item;
    await col.doc(id).set(fields);
    console.log(`  ✅  ${collectionName}/${id}`);
    count++;
  }
  return count;
}

async function main() {
  console.log("\n🔥  Seeding Firestore — Titan Football Tips\n");

  try {
    console.log("📁  categories");
    const catCount = await seedCollection("categories", categories);

    console.log("\n📁  matches");
    const matchCount = await seedCollection("matches", matches);

    console.log("\n📁  wonPredictions");
    const wonCount = await seedCollection("wonPredictions", wonPredictions);

    console.log(`\n✨  Done! Seeded:`);
    console.log(`    • ${catCount} categories`);
    console.log(`    • ${matchCount} matches`);
    console.log(`    • ${wonCount} wonPredictions\n`);
  } catch (err) {
    console.error("\n❌  Seed failed:", err.message, "\n");
    process.exit(1);
  }

  process.exit(0);
}

main();
