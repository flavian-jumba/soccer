/**
 * Grant, revoke and list admin access for the Titan admin app.
 *
 * Admin rights live in two places on purpose, and this script is the only
 * writer of both:
 *
 *   1. the `admin` custom claim on the Firebase Auth account — the fast path
 *      the security rules read straight off the ID token;
 *   2. a document at /admins/{uid} — the bootstrap path, so access works on the
 *      very next request instead of waiting for the account's ID token to
 *      refresh (which can take up to an hour, or a sign-out).
 *
 * Usage:
 *   node scripts/set-admin.js --list
 *   node scripts/set-admin.js grant  someone@example.com [more@example.com ...]
 *   node scripts/set-admin.js revoke someone@example.com
 *
 * Requires serviceAccountKey.json in the project root (already used by
 * scripts/seed-firestore.js and scripts/deploy-firestore-rules.js).
 */

const path = require("path");
const admin = require("firebase-admin");

const serviceAccount = require(
  path.join(__dirname, "../serviceAccountKey.json"),
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function listAdmins() {
  const { users } = await auth.listUsers(1000);
  const roster = await db.collection("admins").get();
  const rosterUids = new Set(roster.docs.map((doc) => doc.id));

  console.log("Accounts:");
  for (const user of users) {
    const hasClaim = user.customClaims?.admin === true;
    const inRoster = rosterUids.has(user.uid);
    const label = hasClaim || inRoster ? "ADMIN" : "     ";
    const detail = [
      hasClaim ? "claim" : null,
      inRoster ? "roster" : null,
    ].filter(Boolean);
    console.log(
      `  ${label}  ${user.email ?? "(no email)"}  ${user.uid}` +
        (detail.length ? `  [${detail.join(" + ")}]` : ""),
    );
  }
}

async function setAdmin(email, isAdmin) {
  const user = await auth.getUserByEmail(email);

  // Merge rather than replace: other claims on the account stay intact.
  const claims = { ...(user.customClaims ?? {}) };
  if (isAdmin) {
    claims.admin = true;
  } else {
    delete claims.admin;
  }
  await auth.setCustomUserClaims(user.uid, claims);

  const rosterRef = db.collection("admins").doc(user.uid);
  if (isAdmin) {
    await rosterRef.set(
      {
        email: user.email ?? null,
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    await rosterRef.delete();
  }

  // Any token already minted still carries the old claim. Revoking forces a
  // refresh, so a removal takes effect immediately instead of up to an hour later.
  if (!isAdmin) {
    await auth.revokeRefreshTokens(user.uid);
  }

  console.log(
    `${isAdmin ? "Granted" : "Revoked"} admin for ${user.email} (${user.uid})`,
  );
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--list" || args[0] === "list") {
    await listAdmins();
    return;
  }

  const command = args[0];
  const emails = args.slice(1);

  if (command !== "grant" && command !== "revoke") {
    throw new Error(
      `Unknown command "${command}". Expected one of: grant, revoke, list.`,
    );
  }
  if (emails.length === 0) {
    throw new Error(`No email addresses given. Usage: ${command} <email> ...`);
  }

  for (const email of emails) {
    await setAdmin(email, command === "grant");
  }

  console.log("");
  await listAdmins();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
