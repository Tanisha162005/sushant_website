CREATE TYPE "public"."asset_type" AS ENUM('thumbnail', 'video', 'pdf', 'zip');--> statement-breakpoint
CREATE TABLE "course_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"object_key" varchar(1024) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"storage_provider" varchar(50) DEFAULT 'cloudflare-r2' NOT NULL,
	"checksum" varchar(64),
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_assets_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
ALTER TABLE "course_assets" ADD CONSTRAINT "course_assets_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;