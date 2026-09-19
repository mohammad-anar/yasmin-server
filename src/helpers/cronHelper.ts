import cron from "node-cron";
import { prisma } from "./prisma.js";

/**
 * Synchronize user roles and subscription statuses with the current time
 */
export const syncSubscriptionRolesJob = async () => {
  try {
    const now = new Date();
    console.log(`⏱️ [Cron Job] Running hourly subscription & role synchronization at ${now.toISOString()}...`);

    // 1. Mark expired active subscriptions as EXPIRED
    const expiredSubs = await prisma.subscription.updateMany({
      where: {
        endDate: { lte: now },
        subscriptionState: { in: ["ACTIVE", "SUBSCRIPTION_STATE_ACTIVE"] },
      },
      data: {
        subscriptionState: "EXPIRED",
      },
    });

    if (expiredSubs.count > 0) {
      console.log(`  🔻 [Cron Job] Marked ${expiredSubs.count} expired subscription(s) as EXPIRED.`);
    }

    // 2. Fetch all non-admin users with their latest subscription
    const users = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" },
      },
      include: {
        subscription: true,
      },
    });

    let promoted = 0;
    let demoted = 0;

    for (const user of users) {
      const isSubActive =
        !!user.subscription &&
        new Date(user.subscription.endDate) > now &&
        user.subscription.subscriptionState !== "EXPIRED" &&
        user.subscription.subscriptionState !== "REVOKED";

      const targetRole = isSubActive ? "PREMIUM" : "USER";

      if (user.role !== targetRole) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: targetRole },
        });

        if (targetRole === "PREMIUM") {
          promoted++;
          console.log(`  ⭐ [Cron Job] Promoted ${user.email || user.id} -> PREMIUM`);
        } else {
          demoted++;
          console.log(`  🔻 [Cron Job] Demoted ${user.email || user.id} -> USER`);
        }
      }
    }

    console.log(`✅ [Cron Job] Synchronization finished: ${promoted} promoted, ${demoted} demoted.`);
  } catch (error) {
    console.error("❌ [Cron Job] Error during hourly subscription sync:", error);
  }
};

/**
 * Initialize all recurring cron jobs
 */
export const initCronJobs = () => {
  console.log("⏰ Initializing scheduled cron jobs...");

  // Run once immediately on startup
  syncSubscriptionRolesJob();

  // Schedule to run every hour at minute 0 ("0 * * * *")
  cron.schedule("0 * * * *", async () => {
    await syncSubscriptionRolesJob();
  });

  console.log("✅ Hourly subscription & role sync cron job scheduled (every 1 hour).");
};
