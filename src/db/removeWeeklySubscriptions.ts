import { prisma } from "../helpers/prisma.js";

/**
 * Remove all weekly subscription records from the database and demote users if they have no other active subscription
 */
export const removeWeeklySubscriptions = async () => {
  try {
    console.log("🧹 [Cleanup] Searching for weekly subscription records...");

    // Find all subscriptions matching weekly type or product id
    const weeklySubs = await prisma.subscription.findMany({
      where: {
        OR: [
          { type: { equals: "weekly", mode: "insensitive" } },
          { productId: { contains: "weekly", mode: "insensitive" } },
          { token: { contains: "weekly", mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    if (weeklySubs.length === 0) {
      console.log("ℹ️ [Cleanup] No weekly subscriptions found in the database.");
      return { deletedCount: 0, demotedCount: 0 };
    }

    console.log(`Found ${weeklySubs.length} weekly subscription(s) to remove:`);
    const userIdsToCheck = weeklySubs.map((s) => s.userId);

    for (const sub of weeklySubs) {
      console.log(
        `  - Sub ID: ${sub.id} (User: ${sub.user?.email || sub.userId}, Type: ${sub.type}, Product: ${sub.productId || "none"})`
      );
    }

    // Delete the weekly subscription records
    const deleteResult = await prisma.subscription.deleteMany({
      where: {
        id: { in: weeklySubs.map((s) => s.id) },
      },
    });

    console.log(`🗑️ Successfully deleted ${deleteResult.count} weekly subscription(s).`);

    // Reconcile user roles for affected users
    console.log("🔄 Reconciling affected user roles...");
    let demoted = 0;
    const now = new Date();

    for (const userId of userIdsToCheck) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (user && user.role !== "ADMIN") {
        const hasOtherActiveSub =
          !!user.subscription &&
          new Date(user.subscription.endDate) > now &&
          user.subscription.subscriptionState !== "EXPIRED" &&
          user.subscription.subscriptionState !== "REVOKED";

        if (!hasOtherActiveSub && user.role === "PREMIUM") {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "USER" },
          });
          demoted++;
          console.log(`  🔻 Demoted ${user.email || user.id} -> USER`);
        }
      }
    }

    console.log(
      `✅ [Cleanup Complete] Deleted ${deleteResult.count} weekly subscription(s), updated ${demoted} user(s) to USER role.`
    );
    return { deletedCount: deleteResult.count, demotedCount: demoted };
  } catch (error) {
    console.error("❌ [Cleanup Error] Error removing weekly subscriptions:", error);
    throw error;
  }
};

// Allow standalone execution: npx tsx src/db/removeWeeklySubscriptions.ts
if (
  process.argv[1] &&
  (process.argv[1].endsWith("removeWeeklySubscriptions.ts") ||
    process.argv[1].endsWith("removeWeeklySubscriptions.js"))
) {
  removeWeeklySubscriptions()
    .then(() => {
      console.log("Weekly subscription cleanup completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
