import { initializeDatabase } from "../db/schema.ts";
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
