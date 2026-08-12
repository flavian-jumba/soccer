/**
 * Deploy Firestore rules directly with the project service account.
 * This avoids requiring an interactive Firebase CLI login.
 */

const fs = require("fs");
const path = require("path");
const { GoogleAuth } = require("google-auth-library");

const PROJECT_ID = "titanfootballtips-43797";
const RELEASE_ID = "cloud.firestore";
const keyFile = path.join(__dirname, "../serviceAccountKey.json");
const rulesFile = path.join(__dirname, "../firestore.rules");
const apiRoot = "https://firebaserules.googleapis.com/v1";

async function apiRequest(accessToken, url, method, body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `${method} ${url} failed (${response.status}): ${JSON.stringify(payload)}`,
    );
  }
  return payload;
}

async function deploy() {
  const auth = new GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const tokenResult = await client.getAccessToken();
  const accessToken =
    typeof tokenResult === "string" ? tokenResult : tokenResult.token;

  if (!accessToken) {
    throw new Error("Could not obtain a service-account access token.");
  }

  const content = fs.readFileSync(rulesFile, "utf8");
  const ruleset = await apiRequest(
    accessToken,
    `${apiRoot}/projects/${PROJECT_ID}/rulesets`,
    "POST",
    { source: { files: [{ name: "firestore.rules", content }] } },
  );

  const releaseName = `projects/${PROJECT_ID}/releases/${RELEASE_ID}`;
  await apiRequest(
    accessToken,
    `${apiRoot}/${releaseName}`,
    "PATCH",
    { release: { name: releaseName, rulesetName: ruleset.name } },
  );

  console.log(`Firestore rules deployed: ${ruleset.name}`);
  console.log(`Release updated: ${releaseName}`);
}

deploy().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
