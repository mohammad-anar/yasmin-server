import { prisma } from "../helpers/prisma.js";

export const seedPhaseGuides = async () => {
  try {
    console.log("[PhaseGuide Seed] Seeding cycle phase guides...");

    const guides = [
      {
        id: "menstrual",
        label: "Menstrual",
        emoji: "🩸",
        days: "Days 1–5",
        color: "#C0392B",
        softBg: "#FADBD8",
        tagline: "Rest, restore, and look inward — your body is doing its deepest work.",
        hormones: [
          { name: "Oestrogen", level: 1, desc: "At its lowest. Drop triggers lining to shed. Reduces serotonin and dopamine → fatigue and low mood." },
          { name: "Progesterone", level: 1, desc: "Also very low. Its fall from luteal triggers menstruation. Less calming GABA activity." },
          { name: "Prostaglandins", level: 4, desc: "Elevated. Inflammatory compounds cause uterine contractions, cramping, and gut motility issues." },
          { name: "FSH & LH", level: 2, desc: "FSH begins to rise slightly, stimulating follicle recruitment for the next cycle." }
        ],
        physical: [
          "Core temperature at its lowest — cardiovascular performance marginally better but you feel worst",
          "Blood loss reduces iron → impairs oxygen transport, contributing to fatigue",
          "Prostaglandins cause systemic inflammation — joints ache, muscles feel heavy",
          "GI motility increases — bloating, cramping, nausea common",
          "Pain threshold is lower due to reduced oestrogen (oestrogen has analgesic properties)"
        ],
        training: [
          "Low-intensity movement: walking, yoga, gentle stretching, swimming",
          "Yin yoga and restorative practices — parasympathetic activation aids recovery",
          "Light resistance at RPE 5–6 can help with cramps via endorphin release",
          "Treat this as a deload week — planned rest is a training tool, not a failure"
        ],
        nutrition: [
          "Iron-rich foods to replenish losses: red meat, lentils, spinach, pumpkin seeds",
          "Vitamin C alongside iron to enhance non-haem absorption",
          "Anti-inflammatory foods: omega-3s, turmeric, ginger, dark leafy greens",
          "Magnesium (dark chocolate, nuts, seeds) — reduces cramping and improves mood",
          "Warm, nourishing foods — soups, stews, root vegetables"
        ],
        avoid: [
          "Alcohol — worsens inflammation",
          "Excess caffeine — can worsen cramping",
          "Refined sugar — spikes inflammation",
          "Salty processed foods — worsen bloating"
        ]
      },
      {
        id: "follicular",
        label: "Follicular",
        emoji: "🌱",
        days: "Days 6–13",
        color: "#E67E22",
        softBg: "#FDEBD0",
        tagline: "Rising energy, rising ambition — this is your season of emergence.",
        hormones: [
          { name: "Oestrogen", level: 3, desc: "Steadily rising as dominant follicle grows. Boosts serotonin, dopamine, acetylcholine, and BDNF." },
          { name: "FSH", level: 3, desc: "Drives follicle maturation. Eventually suppressed by oestrogen (negative feedback)." },
          { name: "Testosterone", level: 2, desc: "Gradual rise — supports libido, motivation, and anabolic drive." },
          { name: "Progesterone", level: 1, desc: "Remains very low — no corpus luteum yet. Body uses carbohydrate as primary fuel." }
        ],
        physical: [
          "Core temperature low — cardiovascular efficiency at its best; VO2 max performance superior",
          "Oestrogen promotes glycogen storage — body preferentially burns carbs",
          "Anabolic signalling improves — oestrogen supports muscle protein synthesis",
          "Insulin sensitivity higher than luteal — carbohydrate uptake into muscles is efficient",
          "Note: higher oestrogen increases ligament laxity — ACL injury risk elevates near ovulation"
        ],
        training: [
          "Introduce progressive overload — increase weights, intensity, or volume",
          "Strength training, HIIT, and high-intensity cardio — body handles it well",
          "Try new skills or movement patterns — neuroplasticity is higher",
          "Schedule your most demanding training blocks here",
          "Prioritise warm-up given increasing ligament laxity"
        ],
        nutrition: [
          "Carbohydrate-forward fuelling — insulin sensitivity is high and carbs are preferred fuel",
          "Adequate protein (1.6–2.2g/kg) to support training and muscle protein synthesis",
          "Lighter, fresh foods — salads, lean proteins, whole grains",
          "Fermented foods (kefir, kimchi) support gut microbiome and oestrogen metabolism",
          "Zinc-rich foods (pumpkin seeds, oysters) to support follicle maturation"
        ],
        avoid: [
          "Appetite often lower — listen to hunger signals",
          "Best phase for dietary flexibility"
        ]
      },
      {
        id: "ovulatory",
        label: "Ovulatory",
        emoji: "✨",
        days: "Days 14–17",
        color: "#27AE60",
        softBg: "#D5F5E3",
        tagline: "Peak power, peak presence — you are at your most magnetic and capable.",
        hormones: [
          { name: "Oestrogen", level: 5, desc: "Peaks sharply — triggers LH surge. Oestradiol at highest point of entire cycle." },
          { name: "LH", level: 5, desc: "LH surge triggers ovulation — mature follicle ruptures and releases egg. Lasts ~24–48 hours." },
          { name: "Testosterone", level: 3, desc: "Peaks around ovulation — drives libido, assertiveness, and power output." },
          { name: "Progesterone", level: 1, desc: "Still low but begins to rise as ruptured follicle transforms into corpus luteum." }
        ],
        physical: [
          "Absolute peak physical capacity — strength, power, and anaerobic threshold are highest",
          "Core temperature remains low — optimal for endurance performance",
          "Increased joint laxity at peak due to oestrogen spike — ACL injury risk highest",
          "Cardiovascular output and VO2 uptake efficiency are excellent",
          "Appetite may increase slightly — body preparing energetically"
        ],
        training: [
          "Maximum intensity efforts — test PRs in strength, power, or speed",
          "Competition days, events, and races — time them here when possible",
          "HIIT, sprint work, and explosive power training",
          "Group training and team sports — competitive drive is highest",
          "CRITICAL: thorough warm-up and neuromuscular activation — ACL risk is real"
        ],
        nutrition: [
          "Support high output with adequate carbohydrate around training",
          "Cruciferous vegetables (broccoli, Brussels sprouts) support oestrogen metabolism via DIM",
          "Maintain high protein to support recovery from intense sessions",
          "Antioxidants (berries, leafy greens) to manage oxidative stress",
          "Prioritise post-workout nutrition — carb + protein within 30–60 mins"
        ],
        avoid: [
          "Peak ligament laxity: always warm up thoroughly",
          "Activate glutes/hamstrings before lower body",
          "Avoid cutting movements when fatigued"
        ]
      },
      {
        id: "luteal",
        label: "Luteal",
        emoji: "🌕",
        days: "Days 18–28",
        color: "#8E44AD",
        softBg: "#E8DAEF",
        tagline: "Your body turns inward — honour it. The early luteal builds; the late luteal prepares to let go.",
        hormones: [
          { name: "Progesterone", level: 4, desc: "Dominant hormone. Raises core temp, increases metabolic rate (+100–300 kcal/day), promotes fat oxidation, acts on GABA receptors." },
          { name: "Oestrogen", level: 3, desc: "Secondary mid-luteal peak then falls. Late-luteal drop triggers PMS and eventually menstruation." },
          { name: "Cortisol", level: 3, desc: "Stress response amplified in late luteal — body more reactive to stressors. High cortisol worsens PMS." },
          { name: "Serotonin", level: 2, desc: "Falls as oestrogen drops → carbohydrate cravings, low mood, irritability, sleep disruption. Core PMS mechanism." }
        ],
        physical: [
          "Core temperature rises 0.3–0.5°C — reduces cardiovascular efficiency and heat tolerance",
          "Metabolic rate increases — genuine calorie needs rise ~100–300 kcal/day; cravings are physiological",
          "Shift to fat oxidation — high-intensity performance declines; moderate endurance may benefit",
          "Fluid retention increases — bloating, breast tenderness, puffiness common",
          "Heart rate elevated for same workload — perceived effort is genuinely higher",
          "Sleep quality declines — late luteal hormone withdrawal disrupts REM sleep"
        ],
        training: [
          "Early luteal (days 18–21): moderate training, strength work still productive",
          "Late luteal (days 22–28): shift lower — brisk walks, Pilates, moderate yoga, light weights",
          "Longer warm-ups to compensate for higher resting HR",
          "Steady-state cardio at moderate intensity — fat oxidation efficiency feels good",
          "Focus on form and mind-muscle connection rather than load",
          "Prioritise sleep above training — quality impacts next cycle's recovery"
        ],
        nutrition: [
          "Increase calories modestly (+100–300 kcal) — metabolically justified, not emotional eating",
          "Complex carbohydrates (sweet potato, oats, brown rice) raise serotonin — address cravings with quality carbs",
          "Magnesium (300–400mg) reduces PMS symptoms including mood, cramping, and sleep",
          "Vitamin B6 (salmon, chicken, banana) supports serotonin synthesis from tryptophan",
          "Calcium-rich foods — deficiency worsens PMS",
          "Reduce sodium to manage fluid retention; increase potassium (bananas, avocado)"
        ],
        avoid: [
          "Refined sugar — worsens mood swings",
          "Alcohol — severely worsens PMS mood",
          "Excessive caffeine — worsens anxiety and sleep",
          "High sodium — amplifies bloating"
        ]
      }
    ];

    for (const guide of guides) {
      await prisma.phaseGuide.upsert({
        where: { id: guide.id },
        update: {
          label: guide.label,
          emoji: guide.emoji,
          days: guide.days,
          color: guide.color,
          softBg: guide.softBg,
          tagline: guide.tagline,
          hormones: guide.hormones,
          physical: guide.physical,
          training: guide.training,
          nutrition: guide.nutrition,
          avoid: guide.avoid
        },
        create: {
          id: guide.id,
          label: guide.label,
          emoji: guide.emoji,
          days: guide.days,
          color: guide.color,
          softBg: guide.softBg,
          tagline: guide.tagline,
          hormones: guide.hormones,
          physical: guide.physical,
          training: guide.training,
          nutrition: guide.nutrition,
          avoid: guide.avoid
        }
      });
    }

    console.log("[PhaseGuide Seed] Seeding phase guides complete.");
  } catch (error) {
    console.error("[PhaseGuide Seed] Error seeding cycle phase guides:", error);
  }
};
