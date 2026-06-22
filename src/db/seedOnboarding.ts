import { prisma } from "../helpers/prisma.js";
import { OnboardingService } from "../app/modules/onboarding/onboarding.service.js";

export const seedOnboardingOptions = async () => {
  try {
    console.log("[Onboarding Seed] Seeding/refreshing default onboarding options...");
    
    await OnboardingService.seedStep(1);
    console.log("[Onboarding Seed] Step 1 (Contraceptions) seeded.");
    
    await OnboardingService.seedStep(2);
    console.log("[Onboarding Seed] Step 2 (Contraception Details) seeded.");
    
    await OnboardingService.seedStep(3);
    console.log("[Onboarding Seed] Step 3 (Daily Check-ins) seeded.");
    
    await OnboardingService.seedStep(4);
    console.log("[Onboarding Seed] Step 4 (Symptoms & Goals) seeded.");
    
    console.log("[Onboarding Seed] Default onboarding options seeded successfully.");
  } catch (error) {
    console.error("[Onboarding Seed] Error seeding default onboarding options:", error);
  }
};
