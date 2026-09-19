import { prisma } from "../helpers/prisma.js";

export const syncUserRoles = async () => {
  try {
    console.log("🔄 [Role Sync] Synchronizing user roles with active subscriptions...");
    const now = new Date();

    // Find all non-admin users with their subscription records
    const users = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" },
      },
      include: {
        subscription: true,
      },
    });

    let promotedCount = 0;
    let demotedCount = 0;
    let unchangedCount = 0;

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
          promotedCount++;
          console.log(`  ⭐ Promoted ${user.email || user.id} -> PREMIUM (Active subscription until ${user.subscription?.endDate?.toISOString()})`);
        } else {
          demotedCount++;
          console.log(`  🔻 Demoted ${user.email || user.id} -> USER (Subscription expired/inactive)`);
        }
      } else {
        unchangedCount++;
      }
    }

    console.log(`✅ [Role Sync] Complete: ${promotedCount} promoted to PREMIUM, ${demotedCount} updated to USER, ${unchangedCount} already in sync.`);
    return { promotedCount, demotedCount, unchangedCount };
  } catch (error) {
    console.error("❌ [Role Sync] Error synchronizing user roles:", error);
    throw error;
  }
};

// Allow standalone execution: npx tsx src/db/syncUserRoles.ts
if (process.argv[1] && (process.argv[1].endsWith("syncUserRoles.ts") || process.argv[1].endsWith("syncUserRoles.js"))) {
  syncUserRoles()
    .then(() => {
      console.log("Database updated successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
