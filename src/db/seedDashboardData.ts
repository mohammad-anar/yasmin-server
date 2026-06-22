import { prisma } from "../helpers/prisma.js";

export const seedDashboardData = async () => {
  try {
    console.log("[Dashboard Seed] Checking/seeding mock dashboard data...");

    // Find all users
    const users = await prisma.user.findMany();
    if (users.length === 0) return;

    // We want at least some premium users and active subscriptions
    const plans = ["weekly", "monthly", "yearly"];
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Skip admin users
      if (user.role === "ADMIN") continue;

      // 1. Seed user profile if it doesn't exist
      const existingProfile = await prisma.userProfile.findUnique({
        where: { created_by: user.email! }
      });

      if (!existingProfile && user.email) {
        const height = 160 + (i % 5) * 5;
        const weight = 55 + (i % 5) * 4;
        const age = 22 + (i % 5) * 3;
        const activityLevels = ["sedentary", "lightly_active", "moderately_active", "very_active"];
        const activity_level = activityLevels[i % activityLevels.length];
        
        await prisma.userProfile.create({
          data: {
            created_by: user.email,
            height_cm: height,
            weight_kg: weight,
            age: age,
            activity_level: activity_level,
            dietary_preferences: i % 2 === 0 ? "vegetarian" : "none",
            injuries: i % 3 === 0 ? ["knee_pain"] : [],
            exercise_dislikes: i % 4 === 0 ? ["running"] : [],
            device_platform: i % 2 === 0 ? "ios" : "android",
            device_token: `mock_token_${user.id}`
          }
        });
        console.log(`[Dashboard Seed] Seeded mock UserProfile for ${user.email}`);
      }

      // 2. Seed subscription for some users
      // Let's make every second user a premium member with a subscription
      if (i % 2 === 0) {
        const existingSub = await prisma.subscription.findUnique({
          where: { userId: user.id }
        });

        if (!existingSub) {
          const type = plans[i % plans.length];
          const startDate = new Date();
          // subtract some days so it looks realistic
          startDate.setDate(startDate.getDate() - (i * 2 + 1));
          
          const endDate = new Date();
          // make half of them active and half expired
          const durationDays = type === "weekly" ? 7 : type === "monthly" ? 30 : 365;
          const isExpired = i % 4 === 0;
          if (isExpired) {
            endDate.setDate(startDate.getDate() - 1); // expired yesterday
          } else {
            endDate.setDate(startDate.getDate() + durationDays); // active
          }

          await prisma.subscription.create({
            data: {
              userId: user.id,
              type,
              startDate,
              endDate,
              token: `mock_receipt_token_${user.id}`
            }
          });

          // Update user role to PREMIUM if subscription is active
          if (!isExpired) {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "PREMIUM" }
            });
          }
          console.log(`[Dashboard Seed] Seeded mock ${type} Subscription for ${user.email} (Active: ${!isExpired})`);
        }
      }
    }
  } catch (error) {
    console.error("[Dashboard Seed] Error seeding mock dashboard data:", error);
  }
};
