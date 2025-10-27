CREATE TABLE "email_processing_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"rule_id" varchar,
	"email_id" text NOT NULL,
	"subject" text,
	"sender" text,
	"processed_at" timestamp DEFAULT now(),
	"extracted_data" jsonb NOT NULL,
	"pdf_path" text,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "processing_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"query" text NOT NULL,
	"date_range" text,
	"email_type" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_emails" integer DEFAULT 0,
	"processed_emails" integer DEFAULT 0,
	"successful_emails" integer DEFAULT 0,
	"failed_emails" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "processing_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"pattern" text NOT NULL,
	"fields" jsonb NOT NULL,
	"output_template" text NOT NULL,
	"required_fields" jsonb,
	"pdf_sections" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"gmail_tokens" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "email_processing_results" ADD CONSTRAINT "email_processing_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_processing_results" ADD CONSTRAINT "email_processing_results_rule_id_processing_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."processing_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_rules" ADD CONSTRAINT "processing_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;