import { prisma } from "../helpers/prisma.js";

export const seedWorkouts = async () => {
  try {
    const count = await prisma.workout.count();
    if (count > 0) {
      console.log("[Workout Seed] Workouts already seeded.");
      return;
    }

    const defaultWorkouts = [
      {
        name: "Gentle Flow Yoga",
        desc: "A restorative yoga sequence designed for day 1–3 of your cycle. Focus on releasing tension in the hips and lower back.",
        phase: ["menstrual", "all"],
        intensity: "low",
        duration: "15-30",
        duration_mins: 25,
        bodypart: "mobility",
        equipment: "yoga mat",
        phaseNote: "During menstruation, prostaglandins cause inflammation and cramping. Gentle movement increases blood flow and reduces discomfort.",
        exercises: [
          {
            name: "Child's Pose",
            sets: [
              { reps: "60s hold" },
              { reps: "60s hold" }
            ]
          },
          {
            name: "Supine Twist",
            sets: [
              { reps: "45s side" },
              { reps: "45s side" }
            ]
          }
        ]
      },
      {
        name: "Full Body Sculpt",
        desc: "A high-energy full body strength session to capitalize on rising oestrogen levels.",
        phase: ["follicular", "ovulatory"],
        intensity: "moderate",
        duration: "30-45",
        duration_mins: 40,
        bodypart: "full body",
        equipment: "dumbbells",
        phaseNote: "Estrogen levels are rising, giving you more energy and better recovery. Great time for strength training.",
        exercises: [
          {
            name: "Goblet Squats",
            sets: [
              { reps: 12 },
              { reps: 12 },
              { reps: 12 }
            ]
          },
          {
            name: "Dumbbell Press",
            sets: [
              { reps: 10 },
              { reps: 10 },
              { reps: 10 }
            ]
          }
        ]
      },
      {
        name: "Core Power HIIT",
        desc: "Intense core-focused intervals for peak performance phase.",
        phase: ["ovulatory"],
        intensity: "high",
        duration: "15-30",
        duration_mins: 20,
        bodypart: "core",
        equipment: "no equipment",
        phaseNote: "You are at your physiological peak. High intensity training is most effective now.",
        exercises: [
          {
            name: "Mountain Climbers",
            sets: [
              { reps: "45s" },
              { reps: "45s" }
            ]
          },
          {
            name: "Plank Jacks",
            sets: [
              { reps: "45s" },
              { reps: "45s" }
            ]
          }
        ]
      },
      {
        name: "Lower Body Strength Focus",
        desc: "Focus on glutes and hamstrings to build stability during luteal phase.",
        phase: ["luteal"],
        intensity: "high",
        duration: "45-60",
        duration_mins: 50,
        bodypart: "lower body",
        equipment: "barbell",
        phaseNote: "Building strength in the lower body is crucial to joint stabilization when progesterone rises.",
        exercises: [
          {
            name: "Barbell Deadlifts",
            sets: [
              { reps: 8 },
              { reps: 8 },
              { reps: 8 }
            ]
          },
          {
            name: "Bulgarian Split Squats",
            sets: [
              { reps: 10 },
              { reps: 10 }
            ]
          }
        ]
      },
      {
        name: "Restorative Pilates",
        desc: "Flow and core control session to ease premenstrual symptoms.",
        phase: ["luteal", "menstrual"],
        intensity: "low",
        duration: "15-30",
        duration_mins: 30,
        bodypart: "mobility",
        equipment: "no equipment",
        phaseNote: "Low impact activity aids recovery and manages oestrogen/progesterone drops during premenstrual phase.",
        exercises: [
          {
            name: "Pilates Hundred",
            sets: [
              { reps: "100 count" }
            ]
          },
          {
            name: "Single Leg Stretch",
            sets: [
              { reps: "15 reps" },
              { reps: "15 reps" }
            ]
          }
        ]
      }
    ];

    for (const w of defaultWorkouts) {
      await prisma.workout.create({ data: w });
    }
    console.log("[Workout Seed] Default workouts seeded successfully.");
  } catch (error) {
    console.error("[Workout Seed] Error seeding default workouts:", error);
  }
};
