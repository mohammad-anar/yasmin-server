import { seedSuperAdmin } from "../src/db/seedSuperAdmin.js";
import { seedOnboardingOptions } from "../src/db/seedOnboarding.js";
import { seedWorkouts } from "../src/db/seedWorkouts.js";
import { seedNutrition } from "../src/db/seedNutrition.js";
import { seedPhaseGuides } from "../src/db/seedPhaseGuides.js";
import { seedDashboardData } from "../src/db/seedDashboardData.js";

async function main() {
  console.log("🌱 Starting database seed...");

  await seedSuperAdmin();
  await seedOnboardingOptions();
  await seedWorkouts();
  await seedNutrition();
  await seedPhaseGuides();
  await seedDashboardData();

  console.log("✅ Database seed complete.");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
