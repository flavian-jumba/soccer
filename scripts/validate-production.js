#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const appConfig = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "app.json"), "utf8"),
).expo;
const errors = [];

function requireHttps(label, value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") errors.push(`${label} must use HTTPS.`);
  } catch {
    errors.push(`${label} must be a valid absolute URL.`);
  }
}

const android = appConfig.android ?? {};
const billing = appConfig.extra?.billing ?? {};
const productIds = Object.values(billing.productIds ?? {});
const buildProperties = appConfig.plugins
  ?.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-build-properties")
  ?.[1]?.android;

if (!appConfig.extra?.billingEnabled) {
  errors.push("Billing is disabled.");
}
if (billing.verificationBaseUrl) {
  requireHttps("billing.verificationBaseUrl", billing.verificationBaseUrl);
}
requireHttps("billing.termsUrl", billing.termsUrl);
requireHttps("billing.privacyUrl", billing.privacyUrl);

if (productIds.length === 0) errors.push("No subscription product IDs are configured.");
if (new Set(productIds).size !== productIds.length) {
  errors.push("Subscription product IDs must be unique.");
}
if (buildProperties?.targetSdkVersion !== 36) {
  errors.push("Android targetSdkVersion must be 36 for the 2026 Play deadline.");
}
if (buildProperties?.compileSdkVersion !== 36) {
  errors.push("Android compileSdkVersion must be 36.");
}
if (android.allowBackup !== false) errors.push("Android backups must be disabled.");
if (android.usesCleartextTraffic !== false) {
  errors.push("Cleartext Android network traffic must be disabled.");
}
if (errors.length > 0) {
  console.error("Production validation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Production configuration validation passed.");
}
