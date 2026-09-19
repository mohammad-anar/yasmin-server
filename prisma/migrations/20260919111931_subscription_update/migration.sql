-- AlterTable
ALTER TABLE "community_posts" ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "platform" TEXT NOT NULL DEFAULT 'android',
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "purchaseToken" TEXT,
ADD COLUMN     "subscriptionState" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "phase_guides" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "days" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "softBg" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "hormones" JSONB NOT NULL,
    "physical" TEXT[],
    "training" TEXT[],
    "nutrition" TEXT[],
    "avoid" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phase_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cat" TEXT NOT NULL,
    "phases" TEXT[],
    "why" TEXT NOT NULL,
    "macros" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phases" TEXT[],
    "meal" TEXT NOT NULL,
    "prepTime" TEXT NOT NULL,
    "cals" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "macros" JSONB NOT NULL,
    "ingredients" JSONB NOT NULL,
    "steps" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contraception_options" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contraception_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contraception_detail_options" (
    "id" TEXT NOT NULL,
    "contraceptionKey" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "questionLabel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contraception_detail_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_options" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_options" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptom_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_check_in_options" (
    "id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_check_in_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "phase" TEXT[],
    "intensity" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "duration_mins" INTEGER NOT NULL,
    "bodypart" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "phaseNote" TEXT NOT NULL,
    "exercises" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_workouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contraception_options_key_key" ON "contraception_options"("key");

-- CreateIndex
CREATE UNIQUE INDEX "goal_options_value_key" ON "goal_options"("value");

-- CreateIndex
CREATE UNIQUE INDEX "symptom_options_name_key" ON "symptom_options"("name");

-- CreateIndex
CREATE UNIQUE INDEX "daily_check_in_options_label_key" ON "daily_check_in_options"("label");

-- CreateIndex
CREATE UNIQUE INDEX "saved_workouts_userId_workoutId_key" ON "saved_workouts"("userId", "workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_purchaseToken_key" ON "subscriptions"("purchaseToken");

-- AddForeignKey
ALTER TABLE "saved_workouts" ADD CONSTRAINT "saved_workouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_workouts" ADD CONSTRAINT "saved_workouts_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
