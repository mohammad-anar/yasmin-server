import { prisma } from "../../../helpers/prisma.js";

const getOptions = async () => {
  const contraceptions = await prisma.contraceptionOption.findMany({
    orderBy: { createdAt: "asc" },
  });
  const details = await prisma.contraceptionDetailOption.findMany({
    orderBy: { createdAt: "asc" },
  });
  const goals = await prisma.goalOption.findMany({
    orderBy: { createdAt: "asc" },
  });
  const symptoms = await prisma.symptomOption.findMany({
    orderBy: { createdAt: "asc" },
  });
  const checkins = await prisma.dailyCheckInOption.findMany({
    orderBy: { createdAt: "asc" },
  });

  return {
    contraceptions,
    details,
    goals,
    symptoms,
    checkins,
  };
};

const seedStep = async (stepNum: number) => {
  if (stepNum === 1) {
    // Seed contraception options
    await prisma.contraceptionOption.deleteMany();
    const contraceptionOptions = [
      { key: "pill", icon: "\u{1F48A}", title: "Combined Pill", desc: "Oestrogen + progestogen daily pill", tag: "COCP", accent: "#e8927c" },
      { key: "mirena", icon: "\u{1F529}", title: "Hormonal IUD", desc: "Mirena coil or similar", tag: "Low-dose local", accent: "#7ec8a4" },
      { key: "implant", icon: "\u{1F4CC}", title: "Implant", desc: "Nexplanon arm implant", tag: "Progestogen-only", accent: "#a78bca" },
      { key: "injection", icon: "\u{1F489}", title: "Injection", desc: "Depo-Provera every 12 weeks", tag: "Progestogen-only", accent: "#7ab3d4" },
      { key: "mini", icon: "\u{1F535}", title: "Mini Pill", desc: "Progestogen-only daily pill", tag: "POP", accent: "#d4a76a" },
      { key: "none", icon: "\u{1F319}", title: "No hormonal contraception", desc: "Natural cycle or non-hormonal methods", tag: "Natural cycle", accent: "#c97a9a" },
    ];
    for (const opt of contraceptionOptions) {
      await prisma.contraceptionOption.create({ data: opt });
    }
    return { success: true, message: "Contraception options seeded." };
  }

  if (stepNum === 2) {
    // Seed contraception details options
    await prisma.contraceptionDetailOption.deleteMany();
    const detailOptions = [
      // Pill
      { contraceptionKey: "pill", questionKey: "pillType", questionLabel: "Pill formulation type", type: "select", value: "monophasic", label: "Monophasic (same dose every day)" },
      { contraceptionKey: "pill", questionKey: "pillType", questionLabel: "Pill formulation type", type: "select", value: "biphasic", label: "Biphasic (2 different doses)" },
      { contraceptionKey: "pill", questionKey: "pillType", questionLabel: "Pill formulation type", type: "select", value: "triphasic", label: "Triphasic (3 different doses)" },
      { contraceptionKey: "pill", questionKey: "pillType", questionLabel: "Pill formulation type", type: "select", value: "unknown", label: "I'm not sure" },
      { contraceptionKey: "pill", questionKey: "pillProgestogen", questionLabel: "Progestogen type (check your leaflet)", type: "select", value: "androgenic", label: "Androgenic (levonorgestrel, norethisterone)" },
      { contraceptionKey: "pill", questionKey: "pillProgestogen", questionLabel: "Progestogen type (check your leaflet)", type: "select", value: "anti-androgenic", label: "Anti-androgenic (drospirenone, cyproterone)" },
      { contraceptionKey: "pill", questionKey: "pillProgestogen", questionLabel: "Progestogen type (check your leaflet)", type: "select", value: "neutral", label: "Neutral (desogestrel, gestodene)" },
      { contraceptionKey: "pill", questionKey: "pillProgestogen", questionLabel: "Progestogen type (check your leaflet)", type: "select", value: "unknown", label: "Unknown / not sure" },
      { contraceptionKey: "pill", questionKey: "pillFreeWeek", questionLabel: "Do you take a pill-free / placebo week?", type: "toggle", value: "true", label: "Yes — I have a withdrawal bleed" },
      { contraceptionKey: "pill", questionKey: "pillFreeWeek", questionLabel: "Do you take a pill-free / placebo week?", type: "toggle", value: "false", label: "No — I take it continuously" },

      // Mirena
      { contraceptionKey: "mirena", questionKey: "iudPeriod", questionLabel: "Do you still get a period or bleed?", type: "toggle", value: "regular", label: "Yes — regular and predictable" },
      { contraceptionKey: "mirena", questionKey: "iudPeriod", questionLabel: "Do you still get a period or bleed?", type: "toggle", value: "light", label: "Yes — but lighter / irregular" },
      { contraceptionKey: "mirena", questionKey: "iudPeriod", questionLabel: "Do you still get a period or bleed?", type: "toggle", value: "none", label: "No period at all" },
      { contraceptionKey: "mirena", questionKey: "iudOvulating", questionLabel: "Do you notice cyclical mood or energy changes?", type: "toggle", value: "true", label: "Yes — I seem to have a pattern" },
      { contraceptionKey: "mirena", questionKey: "iudOvulating", questionLabel: "Do you notice cyclical mood or energy changes?", type: "toggle", value: "false", label: "No — things feel fairly flat throughout" },
      { contraceptionKey: "mirena", questionKey: "iudOvulating", questionLabel: "Do you notice cyclical mood or energy changes?", type: "toggle", value: "unsure", label: "I'm not sure" },

      // Implant
      { contraceptionKey: "implant", questionKey: "implantBleed", questionLabel: "Do you experience any bleeding or spotting?", type: "toggle", value: "none", label: "No bleeding at all" },
      { contraceptionKey: "implant", questionKey: "implantBleed", questionLabel: "Do you experience any bleeding or spotting?", type: "toggle", value: "irregular", label: "Irregular spotting" },
      { contraceptionKey: "implant", questionKey: "implantBleed", questionLabel: "Do you experience any bleeding or spotting?", type: "toggle", value: "regular", label: "Still getting regular bleeds" },
      { contraceptionKey: "implant", questionKey: "implantPattern", questionLabel: "Do you notice any consistent mood or energy patterns?", type: "toggle", value: "true", label: "Yes — I notice patterns even without a period" },
      { contraceptionKey: "implant", questionKey: "implantPattern", questionLabel: "Do you notice any consistent mood or energy patterns?", type: "toggle", value: "false", label: "No — feels unpredictable / flat" },

      // Injection
      { contraceptionKey: "injection", questionKey: "injectionBleed", questionLabel: "Current bleeding pattern", type: "toggle", value: "none", label: "No bleeding" },
      { contraceptionKey: "injection", questionKey: "injectionBleed", questionLabel: "Current bleeding pattern", type: "toggle", value: "spotting", label: "Occasional spotting" },
      { contraceptionKey: "injection", questionKey: "injectionBleed", questionLabel: "Current bleeding pattern", type: "toggle", value: "irregular", label: "Irregular heavier bleeds" },

      // Mini
      { contraceptionKey: "mini", questionKey: "miniType", questionLabel: "Which mini pill are you on?", type: "select", value: "cerazette", label: "Cerazette / Cerelle / Desogestrel 75mcg — usually suppresses ovulation" },
      { contraceptionKey: "mini", questionKey: "miniType", questionLabel: "Which mini pill are you on?", type: "select", value: "norethisterone", label: "Norethisterone-based — inconsistent ovulation suppression" },
      { contraceptionKey: "mini", questionKey: "miniType", questionLabel: "Which mini pill are you on?", type: "select", value: "other", label: "Other / not sure" },
      { contraceptionKey: "mini", questionKey: "miniOvulating", questionLabel: "Do you still get a regular period?", type: "toggle", value: "true", label: "Yes — fairly regular pattern" },
      { contraceptionKey: "mini", questionKey: "miniOvulating", questionLabel: "Do you still get a regular period?", type: "toggle", value: "false", label: "No — irregular or no bleed" },

      // None / Natural
      { contraceptionKey: "none", questionKey: "cycleRegular", questionLabel: "Are your cycles generally regular?", type: "toggle", value: "true", label: "Yes — fairly predictable" },
      { contraceptionKey: "none", questionKey: "cycleRegular", questionLabel: "Are your cycles generally regular?", type: "toggle", value: "false", label: "No — quite variable or irregular" },
      { contraceptionKey: "none", questionKey: "alreadyTracking", questionLabel: "Do you track your cycle already?", type: "toggle", value: "app", label: "Yes — using an app" },
      { contraceptionKey: "none", questionKey: "alreadyTracking", questionLabel: "Do you track your cycle already?", type: "toggle", value: "bbt", label: "Yes — basal body temperature" },
      { contraceptionKey: "none", questionKey: "alreadyTracking", questionLabel: "Do you track your cycle already?", type: "toggle", value: "none", label: "No — starting fresh" },
    ];
    for (const opt of detailOptions) {
      await prisma.contraceptionDetailOption.create({ data: opt });
    }
    return { success: true, message: "Contraception details options seeded." };
  }

  if (stepNum === 3) {
    // Seed daily check-in options
    await prisma.dailyCheckInOption.deleteMany();
    const dailyCheckInOptions = [
      { icon: "\u{1F634}", label: "Sleep quality", isDefault: true },
      { icon: "\u{26A1}", label: "Energy level", isDefault: true },
      { icon: "\u{1F3CB}\u{FE0F}", label: "Training performance", isDefault: true },
      { icon: "\u{1F624}", label: "Mood & motivation", isDefault: true },
      { icon: "\u{1F922}", label: "Bloating / GI", isDefault: false },
      { icon: "\u{1F36B}", label: "Cravings", isDefault: false },
      { icon: "\u{1F4A7}", label: "Hydration", isDefault: false },
      { icon: "\u{2764}\u{FE0F}", label: "Resting HR / HRV", isDefault: false },
      { icon: "\u{1F321}\u{FE0F}", label: "Basal body temp", isDefault: false },
      { icon: "\u{1FA78}", label: "Flow / bleeding", isDefault: false },
    ];
    for (const opt of dailyCheckInOptions) {
      await prisma.dailyCheckInOption.create({ data: opt });
    }
    return { success: true, message: "Daily check-in options seeded." };
  }

  if (stepNum === 4) {
    // Seed symptoms and goals
    await prisma.symptomOption.deleteMany();
    await prisma.goalOption.deleteMany();

    const symptomOptions = [
      "PMS mood changes", "Cramping", "Fatigue", "Bloating", "Cravings", "Headaches",
      "Breast tenderness", "Anxiety / low mood", "Sleep disruption", "Brain fog", "Skin breakouts", "None / minimal"
    ];
    for (const name of symptomOptions) {
      await prisma.symptomOption.create({ data: { name } });
    }

    const goalOptions = [
      { value: "build_muscle", label: "Build strength & muscle" },
      { value: "improve_endurance", label: "Improve endurance / cardio fitness" },
      { value: "weight_loss", label: "Lose body fat" },
      { value: "general_fitness", label: "General health & wellbeing" },
      { value: "athletic_performance", label: "Athletic performance / competition" },
    ];
    for (const opt of goalOptions) {
      await prisma.goalOption.create({ data: opt });
    }

    return { success: true, message: "Symptoms and Goal options seeded." };
  }

  throw new Error("Invalid step number. Choose 1, 2, 3 or 4.");
};

// Contraception option management
const createContraception = async (data: { key: string; icon: string; title: string; desc: string; tag: string; accent: string }) => {
  return await prisma.contraceptionOption.create({ data });
};
const deleteContraception = async (id: string) => {
  return await prisma.contraceptionOption.delete({ where: { id } });
};

// Contraception detail option management
const createContraceptionDetail = async (data: { contraceptionKey: string; questionKey: string; questionLabel: string; type: string; value: string; label: string }) => {
  return await prisma.contraceptionDetailOption.create({ data });
};
const deleteContraceptionDetail = async (id: string) => {
  return await prisma.contraceptionDetailOption.delete({ where: { id } });
};

// Goal option management
const createGoal = async (data: { value: string; label: string }) => {
  return await prisma.goalOption.create({ data });
};
const deleteGoal = async (id: string) => {
  return await prisma.goalOption.delete({ where: { id } });
};

// Symptom option management
const createSymptom = async (data: { name: string }) => {
  return await prisma.symptomOption.create({ data });
};
const deleteSymptom = async (id: string) => {
  return await prisma.symptomOption.delete({ where: { id } });
};

// Daily check-in option management
const createDailyCheckIn = async (data: { icon: string; label: string; isDefault: boolean }) => {
  return await prisma.dailyCheckInOption.create({ data });
};
const deleteDailyCheckIn = async (id: string) => {
  return await prisma.dailyCheckInOption.delete({ where: { id } });
};

export const OnboardingService = {
  getOptions,
  seedStep,
  createContraception,
  deleteContraception,
  createContraceptionDetail,
  deleteContraceptionDetail,
  createGoal,
  deleteGoal,
  createSymptom,
  deleteSymptom,
  createDailyCheckIn,
  deleteDailyCheckIn,
};
