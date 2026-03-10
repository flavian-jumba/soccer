# Firestore Database Setup — Titan Football Tips

This guide covers every collection, document structure, and field needed to
power the Free Tips, VIP Tips, and Recently Won sections of the app.

---

## Overview of Collections

```
firestore/
├── categories          ← Free & VIP tip category cards
├── matches             ← Individual tip/prediction cards inside each category
└── wonPredictions      ← Recently Won marquee cards
```

---

## 1. Collection: `categories`

Each document represents one category card (Free or VIP).

### Collection ID

```
categories
```

### Document ID

Use a short human-readable slug as the document ID (e.g. `btts`, `htft`).
This becomes the `categoryId` that `matches` documents reference.

### Fields

| Field         | Type    | Required | Description                                          |
| ------------- | ------- | -------- | ---------------------------------------------------- |
| `title`       | string  | ✅       | Display name, e.g. `"BTTS Tips"`                     |
| `description` | string  | ✅       | Short subtitle, e.g. `"Both Teams to Score"`         |
| `icon`        | string  | ✅       | Icon name from the allowed set (see below)           |
| `isVip`       | boolean | ✅       | `false` = Free tier, `true` = VIP tier               |
| `matchCount`  | number  | ✅       | Number of active tips in this category               |
| `winRate`     | number  | ✅       | Win rate percentage, e.g. `78` (no `%` symbol)       |
| `order`       | number  | ✅       | Display order within the Free or VIP list (1, 2, 3…) |

### Allowed values for `icon`

The app maps these strings to Lucide icons. Only use values from this list:

```
Goal | TrendingUp | Target | Trophy | Zap | Crown | Star | Flame | Award | Percent
```

### Example Documents

**Document ID:** `btts`

```json
{
  "title": "BTTS Tips",
  "description": "Both Teams to Score",
  "icon": "Goal",
  "isVip": false,
  "matchCount": 8,
  "winRate": 78,
  "order": 1
}
```

**Document ID:** `htft`

```json
{
  "title": "HT/FT Tips",
  "description": "Halftime/Fulltime",
  "icon": "Trophy",
  "isVip": true,
  "matchCount": 5,
  "winRate": 89,
  "order": 1
}
```

### All categories to create

#### Free Categories (isVip: false)

| Document ID | title     | description         | icon         | winRate | order |
| ----------- | --------- | ------------------- | ------------ | ------- | ----- |
| `btts`      | BTTS Tips | Both Teams to Score | `Goal`       | 78      | 1     |
| `over25`    | Over 2.5  | Over 2.5 Goals      | `TrendingUp` | 82      | 2     |
| `1x2`       | 1X2 Tips  | Match Winner        | `Target`     | 71      | 3     |
| `draws`     | Draw Tips | Draw Predictions    | `Percent`    | 65      | 4     |

#### VIP Categories (isVip: true)

| Document ID | title         | description             | icon     | winRate | order |
| ----------- | ------------- | ----------------------- | -------- | ------- | ----- |
| `htft`      | HT/FT Tips    | Halftime/Fulltime       | `Trophy` | 89      | 1     |
| `combo`     | Combo Tips    | Accumulator Bets        | `Zap`    | 85      | 2     |
| `megaodds`  | Mega Odds     | High Value Tips         | `Crown`  | 76      | 3     |
| `correct`   | Correct Score | Exact Score Predictions | `Star`   | 68      | 4     |
| `daily2`    | Daily 2 Odds  | Sure 2 Odds Daily       | `Flame`  | 94      | 5     |
| `vipsingle` | VIP Singles   | Premium Single Tips     | `Award`  | 88      | 6     |

---

## 2. Collection: `matches`

Each document is a single tip/prediction shown inside a category's detail sheet.

### Collection ID

```
matches
```

### Document ID

Use auto-generated Firestore IDs, or a manual slug like `m1`, `m2`, etc.

### Fields

| Field        | Type   | Required | Description                                                |
| ------------ | ------ | -------- | ---------------------------------------------------------- |
| `categoryId` | string | ✅       | Must match a document ID in `categories` (e.g. `"btts"`)   |
| `league`     | string | ✅       | League name, e.g. `"Premier League"`                       |
| `homeTeam`   | string | ✅       | Home team name                                             |
| `awayTeam`   | string | ✅       | Away team name                                             |
| `prediction` | string | ✅       | The tip text, e.g. `"BTTS - Yes"`                          |
| `odds`       | string | ✅       | Decimal odds as a string, e.g. `"1.72"`                    |
| `status`     | string | ✅       | One of: `"won"` / `"lost"` / `"pending"`                   |
| `date`       | string | ✅       | ISO date string `"YYYY-MM-DD"`, e.g. `"2026-03-02"`        |
| `time`       | string | ✅       | Kick-off time `"HH:MM"`, e.g. `"15:00"`                    |
| `score`      | string | ❌       | Final score, e.g. `"2-1"`. Only set once match is finished |
| `leagueIcon` | string | ❌       | Optional URL to a league badge image                       |

### Status values explained

| Value       | When to use                  |
| ----------- | ---------------------------- |
| `"pending"` | Match hasn't been played yet |
| `"won"`     | Prediction was correct       |
| `"lost"`    | Prediction was wrong         |

### Example Document

**Document ID:** `m1`

```json
{
  "categoryId": "btts",
  "league": "Premier League",
  "homeTeam": "Manchester United",
  "awayTeam": "Liverpool",
  "prediction": "BTTS - Yes",
  "odds": "1.72",
  "status": "won",
  "date": "2026-03-02",
  "time": "15:00",
  "score": "2-2"
}
```

**Document ID:** `m3` (pending — no score yet)

```json
{
  "categoryId": "btts",
  "league": "Serie A",
  "homeTeam": "AC Milan",
  "awayTeam": "Inter Milan",
  "prediction": "BTTS - Yes",
  "odds": "1.80",
  "status": "pending",
  "date": "2026-03-03",
  "time": "18:45"
}
```

---

## 3. Collection: `wonPredictions`

Powers the scrolling **Recently Won** marquee at the bottom of the home screen.
Only add documents here for predictions that have already **won**.

### Collection ID

```
wonPredictions
```

### Document ID

Auto-generated Firestore IDs, or slugs like `w1`, `w2`.

### Fields

| Field        | Type      | Required | Description                                                        |
| ------------ | --------- | -------- | ------------------------------------------------------------------ |
| `homeTeam`   | string    | ✅       | Home team name (keep short, e.g. `"Man United"`)                   |
| `awayTeam`   | string    | ✅       | Away team name                                                     |
| `prediction` | string    | ✅       | Short prediction label, e.g. `"BTTS Yes"`                          |
| `odds`       | string    | ✅       | Decimal odds as string, e.g. `"1.72"`                              |
| `score`      | string    | ✅       | Final score, e.g. `"2-2"`                                          |
| `league`     | string    | ✅       | Short league name, e.g. `"EPL"`, `"La Liga"`                       |
| `isVip`      | boolean   | ✅       | `true` = renders gold crown card, `false` = green card             |
| `wonAt`      | timestamp | ✅       | Firestore Timestamp of when the prediction won (used for ordering) |

### Example Documents

**Standard (free) won card:**

```json
{
  "homeTeam": "Man United",
  "awayTeam": "Liverpool",
  "prediction": "BTTS Yes",
  "odds": "1.72",
  "score": "2-2",
  "league": "EPL",
  "isVip": false,
  "wonAt": "<Firestore Timestamp>"
}
```

**VIP won card (gold crown design):**

```json
{
  "homeTeam": "Arsenal",
  "awayTeam": "West Ham",
  "prediction": "HT/FT 1/1",
  "odds": "2.20",
  "score": "3-0",
  "league": "EPL",
  "isVip": true,
  "wonAt": "<Firestore Timestamp>"
}
```

---

## Firestore Security Rules

Replace the default `allow read, write: if false` in your Firebase console
with these rules. They allow anyone to **read** (public tips), but only
authenticated admins to **write** (you managing the tips).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Public read for all tip data
    match /categories/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    match /matches/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    match /wonPredictions/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

> **Note:** If you don't have admin auth set up yet, temporarily use
> `allow write: if request.auth != null;` so you can add data while logged in.

---

## Indexes Required

Firestore requires composite indexes for queries that filter + order.
Create these in **Firebase Console → Firestore → Indexes → Composite**.

| Collection       | Fields                        | Order | Purpose                               |
| ---------------- | ----------------------------- | ----- | ------------------------------------- |
| `matches`        | `categoryId` ASC, `date` DESC | —     | Fetch tips by category sorted by date |
| `matches`        | `status` ASC, `date` DESC     | —     | Fetch won/pending tips                |
| `wonPredictions` | `wonAt` DESC                  | —     | Fetch latest wins for marquee         |
| `wonPredictions` | `isVip` ASC, `wonAt` DESC     | —     | Filter VIP/free wins                  |
| `categories`     | `isVip` ASC, `order` ASC      | —     | Separate free vs VIP lists in order   |

---

## Step-by-Step: Creating Data in Firebase Console

### Step 1 — Create `categories` collection

1. Go to **Firestore → Data → Start collection**
2. Collection ID: `categories`
3. First document ID: `btts`
4. Add all fields from the table above
5. Click **Save**, then **Add document** for each remaining category

### Step 2 — Create `matches` collection

1. Click **Start collection**
2. Collection ID: `matches`
3. Document ID: `m1` (or auto-generate)
4. Add all fields — remember `score` is **optional**, only add it for finished matches
5. Repeat for all matches

### Step 3 — Create `wonPredictions` collection

1. Click **Start collection**
2. Collection ID: `wonPredictions`
3. For `wonAt`, choose type **timestamp** and set it to the match date/time
4. Set `isVip` to `true` for HT/FT, Correct Score, Combo, Mega Odds predictions

### Step 4 — Update Security Rules

1. Go to **Firestore → Rules**
2. Replace the current rules with the rules in the section above
3. Click **Publish**

### Step 5 — Create Indexes

1. Go to **Firestore → Indexes → Composite → Add index**
2. Create each index from the table above

---

## Next Steps in the App Code

Once the database is set up, the `src/data/mockData.ts` file will be replaced
with Firebase hooks. The suggested file structure:

```
src/
  services/
    firebase.ts          ← Firebase app init & Firestore instance
  hooks/
    use-categories.ts    ← useFreeTips(), useVipTips()
    use-matches.ts       ← useMatchesByCategory(categoryId)
    use-won-predictions.ts ← useWonPredictions()
```

Each hook will use `onSnapshot` for real-time updates so the app
refreshes automatically when you add or update tips in the Firebase console.
