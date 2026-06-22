-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'PREMIUM');

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_name" TEXT,
    "likes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_name" TEXT,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reported_posts" (
    "id" TEXT NOT NULL,
    "post_id" TEXT,
    "comment_id" TEXT,
    "content_type" TEXT NOT NULL,
    "reported_content" TEXT,
    "reported_author" TEXT,
    "reporter_email" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reported_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_data" (
    "id" TEXT NOT NULL,
    "cycle_start_date" TEXT NOT NULL,
    "cycle_length" INTEGER NOT NULL DEFAULT 28,
    "period_length" INTEGER NOT NULL DEFAULT 5,
    "fitness_goal" TEXT NOT NULL DEFAULT 'general_fitness',
    "contraception_type" TEXT NOT NULL DEFAULT 'none',
    "tracking_method" TEXT NOT NULL DEFAULT 'calendar',
    "pill_progestogen" TEXT,
    "cycle_regular" BOOLEAN NOT NULL DEFAULT true,
    "symptoms" TEXT[],
    "daily_checkins" TEXT[],
    "preferred_workout_types" TEXT[],
    "available_equipment" TEXT[],
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "phase" TEXT,
    "cycle_day" INTEGER,
    "mood" TEXT,
    "checkins" TEXT[],
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_logs" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "symptoms" TEXT[],
    "severity" TEXT NOT NULL DEFAULT 'mild',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptom_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "related_record_id" TEXT,
    "related_record_type" TEXT,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "email" TEXT,
    "username" TEXT,
    "passwordHash" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "fcmToken" TEXT,
    "platform" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "age" INTEGER,
    "activity_level" TEXT NOT NULL DEFAULT 'moderately_active',
    "injuries" TEXT[],
    "exercise_dislikes" TEXT[],
    "dietary_preferences" TEXT NOT NULL DEFAULT 'none',
    "device_token" TEXT,
    "device_platform" TEXT,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'yearly',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "token" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_logs" (
    "id" TEXT NOT NULL,
    "date" TEXT,
    "workout_name" TEXT NOT NULL,
    "duration_minutes" DOUBLE PRECISION,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "workout_name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "duration_minutes" DOUBLE PRECISION,
    "exercises" JSONB,
    "total_volume" DOUBLE PRECISION,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_records" (
    "id" TEXT NOT NULL,
    "exercise_name" TEXT NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "date_achieved" TEXT NOT NULL,
    "one_rep_max" DOUBLE PRECISION,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_deviceId_key" ON "users"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_created_by_key" ON "user_profiles"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_data" ADD CONSTRAINT "cycle_data_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_logs" ADD CONSTRAINT "symptom_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;
