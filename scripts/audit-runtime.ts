/**
 * Fail CI when a production dependency has a known advisory.
 *
 * `bun audit` reports the full dependency tree, including dev-only build
 * tooling. This script keeps a small, reviewed allowlist for the Tailwind
 * build chain so runtime findings still fail the check.
 *
 * Review the allowlist by 2026-11-30, or earlier when the Tailwind chain is
 * updated. Do not add runtime packages to this list.
 */

const DEV_ONLY_PACKAGES = new Set([
  "postcss",
  "postcss-nested",
  "postcss-selector-parser",
  "nanoid",
  "source-map-js",
]);

const result = Bun.spawnSync(["bun", "audit", "--json"], {
  stdout: "pipe",
  stderr: "pipe",
});

const stdout = result.stdout.toString().trim();
const stderr = result.stderr.toString().trim();

if (!stdout) {
  console.error("bun audit returned no JSON output.");
  if (stderr) console.error(stderr);
  process.exit(1);
}

let report: Record<string, Array<{ severity: string; title: string; url: string }>>;
try {
  report = JSON.parse(stdout);
} catch {
  console.error("Could not parse bun audit JSON output.");
  console.error(stdout.slice(0, 500));
  process.exit(1);
}

const runtimeFindings: string[] = [];
const allowedFindings: string[] = [];

for (const [packageName, advisories] of Object.entries(report)) {
  if (!Array.isArray(advisories) || advisories.length === 0) continue;
  const target = DEV_ONLY_PACKAGES.has(packageName) ? allowedFindings : runtimeFindings;
  for (const advisory of advisories) {
    target.push(`${packageName} [${advisory.severity}] ${advisory.title} ${advisory.url}`);
  }
}

if (allowedFindings.length > 0) {
  console.log(`Ignoring ${allowedFindings.length} dev-only finding(s) in the Tailwind build chain:`);
  for (const finding of allowedFindings) console.log(`  ${finding}`);
}

if (runtimeFindings.length > 0) {
  console.error(`Found ${runtimeFindings.length} production dependency finding(s):`);
  for (const finding of runtimeFindings) console.error(`  ${finding}`);
  process.exit(1);
}

console.log("No production dependency findings.");
