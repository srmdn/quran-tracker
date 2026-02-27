import { initializeDatabase } from "../db/schema.ts";
import { sendMonthlySnapshotEmails } from "../lib/monthly-email.ts";
import { createMonthlySnapshot, createPreviousMonthSnapshot } from "../lib/monthly-snapshot.ts";

initializeDatabase();

const yearArg = process.env.SNAPSHOT_YEAR;
const monthArg = process.env.SNAPSHOT_MONTH;

const result =
  yearArg && monthArg
    ? createMonthlySnapshot({ year: parseInt(yearArg, 10), month: parseInt(monthArg, 10) })
    : createPreviousMonthSnapshot();

const period = `${result.year}-${String(result.month).padStart(2, "0")}`;

if (result.status === "skipped") {
  console.log(`[snapshot] skipped for ${period}: ${result.reason}`);
  process.exit(0);
}

console.log(`[snapshot] created for ${period}, rows=${result.rowsInserted}`);

try {
  const mail = await sendMonthlySnapshotEmails({ year: result.year, month: result.month });
  console.log(
    `[snapshot-email] period=${period} attempted=${mail.attempted} sent=${mail.sent} failed=${mail.failed}`
  );
  if (mail.failed > 0) {
    for (const failure of mail.failures.slice(0, 5)) {
      console.error(`[snapshot-email] fail ${failure.email}: ${failure.error}`);
    }
  }
} catch (err) {
  console.error(
    `[snapshot-email] fatal error: ${err instanceof Error ? err.message : "Unknown error"}`
  );
}
