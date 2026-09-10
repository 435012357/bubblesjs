CREATE TYPE "public"."access_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."builtin_role" AS ENUM('administrator', 'member');--> statement-breakpoint
CREATE TYPE "public"."menu_type" AS ENUM('directory', 'page', 'operation');--> statement-breakpoint
CREATE TYPE "public"."access_scope_type" AS ENUM('platform', 'company', 'project');--> statement-breakpoint
CREATE TABLE "access_bootstrap" (
	"id" integer PRIMARY KEY NOT NULL,
	"initialized_admin_user_id" uuid NOT NULL,
	"initialized_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_bootstrap_singleton" CHECK ("access_bootstrap"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"actor_account" varchar(32) NOT NULL,
	"actor_name" varchar(100) NOT NULL,
	"scope_type" "access_scope_type" NOT NULL,
	"company_id" uuid,
	"project_id" uuid,
	"action" varchar(120) NOT NULL,
	"object_type" varchar(60) NOT NULL,
	"object_id" text NOT NULL,
	"summary" jsonb NOT NULL,
	"request_id" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_scope_check" CHECK (("audit_logs"."scope_type" = 'platform' AND "audit_logs"."company_id" IS NULL AND "audit_logs"."project_id" IS NULL) OR ("audit_logs"."scope_type" = 'company' AND "audit_logs"."company_id" IS NOT NULL AND "audit_logs"."project_id" IS NULL) OR ("audit_logs"."scope_type" = 'project' AND "audit_logs"."company_id" IS NOT NULL AND "audit_logs"."project_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "permission_cleanup_tombstones" (
	"permission_key" varchar(150) PRIMARY KEY NOT NULL,
	"cleaned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deployment_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(64) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "access_status" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_code_unique" UNIQUE("code"),
	CONSTRAINT "companies_version_positive" CHECK ("companies"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "company_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "access_status" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_members_company_user_uq" UNIQUE("company_id","user_id"),
	CONSTRAINT "company_members_version_positive" CHECK ("company_members"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "menu_versions" (
	"scope_type" "access_scope_type" PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "menu_versions_positive" CHECK ("menu_versions"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" "access_scope_type" NOT NULL,
	"parent_id" uuid,
	"type" "menu_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" varchar(80) DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"status" "access_status" DEFAULT 'active' NOT NULL,
	"route_key" varchar(120),
	"permission_key" varchar(150),
	"protected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menus_permission_uq" UNIQUE("scope_type","permission_key")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"key" varchar(150) PRIMARY KEY NOT NULL,
	"scope_type" "access_scope_type" NOT NULL,
	"title" varchar(100) NOT NULL,
	"route_key" varchar(120) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"page_permission_key" varchar(150),
	"admin_only" boolean DEFAULT false NOT NULL,
	"deprecated" boolean DEFAULT false NOT NULL,
	CONSTRAINT "permissions_scope_key_uq" UNIQUE("scope_type","key"),
	CONSTRAINT "permissions_kind_check" CHECK (("permissions"."kind" = 'page' AND "permissions"."page_permission_key" IS NULL) OR ("permissions"."kind" = 'operation' AND "permissions"."page_permission_key" IS NOT NULL AND "permissions"."page_permission_key" <> "permissions"."key"))
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "access_status" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_members_project_user_uq" UNIQUE("project_id","user_id"),
	CONSTRAINT "project_members_version_positive" CHECK ("project_members"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(64) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "access_status" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_company_code_uq" UNIQUE("company_id","code"),
	CONSTRAINT "projects_company_id_uq" UNIQUE("company_id","id"),
	CONSTRAINT "projects_version_positive" CHECK ("projects"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_key" varchar(150) NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_key_pk" PRIMARY KEY("role_id","permission_key")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" "access_scope_type" NOT NULL,
	"company_id" uuid,
	"project_id" uuid,
	"name" varchar(100) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"builtin" "builtin_role",
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_scope_check" CHECK (("roles"."scope_type" = 'platform' AND "roles"."company_id" IS NULL AND "roles"."project_id" IS NULL) OR ("roles"."scope_type" = 'company' AND "roles"."company_id" IS NOT NULL AND "roles"."project_id" IS NULL) OR ("roles"."scope_type" = 'project' AND "roles"."company_id" IS NOT NULL AND "roles"."project_id" IS NOT NULL)),
	CONSTRAINT "roles_version_positive" CHECK ("roles"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "access_bootstrap" ADD CONSTRAINT "access_bootstrap_initialized_admin_user_id_users_id_fk" FOREIGN KEY ("initialized_admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_permission_key_permissions_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permissions"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_parent_id_menus_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_scope_type_page_permission_key_permissions_scope_type_key_fk" FOREIGN KEY ("scope_type","page_permission_key") REFERENCES "public"."permissions"("scope_type","key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_company_id_project_id_projects_company_id_id_fk" FOREIGN KEY ("company_id","project_id") REFERENCES "public"."projects"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_company_id_user_id_company_members_company_id_user_id_fk" FOREIGN KEY ("company_id","user_id") REFERENCES "public"."company_members"("company_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_key_permissions_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permissions"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_project_id_projects_company_id_id_fk" FOREIGN KEY ("company_id","project_id") REFERENCES "public"."projects"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_scope_created_idx" ON "audit_logs" USING btree ("scope_type","company_id","project_id","created_at","id");--> statement-breakpoint
CREATE INDEX "company_members_user_idx" ON "company_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menus_page_uq" ON "menus" USING btree ("scope_type","route_key") WHERE "menus"."type" = 'page';--> statement-breakpoint
CREATE INDEX "menus_scope_parent_idx" ON "menus" USING btree ("scope_type","parent_id");--> statement-breakpoint
CREATE INDEX "project_members_user_idx" ON "project_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_company_status_idx" ON "projects" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "role_permissions_key_idx" ON "role_permissions" USING btree ("permission_key");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_platform_name_uq" ON "roles" USING btree ("name") WHERE "roles"."scope_type" = 'platform';--> statement-breakpoint
CREATE UNIQUE INDEX "roles_company_name_uq" ON "roles" USING btree ("company_id","name") WHERE "roles"."scope_type" = 'company';--> statement-breakpoint
CREATE UNIQUE INDEX "roles_project_name_uq" ON "roles" USING btree ("project_id","name") WHERE "roles"."scope_type" = 'project';--> statement-breakpoint
CREATE UNIQUE INDEX "roles_platform_builtin_uq" ON "roles" USING btree ("builtin") WHERE "roles"."scope_type" = 'platform' AND "roles"."builtin" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_company_builtin_uq" ON "roles" USING btree ("company_id","builtin") WHERE "roles"."scope_type" = 'company' AND "roles"."builtin" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_project_builtin_uq" ON "roles" USING btree ("project_id","builtin") WHERE "roles"."scope_type" = 'project' AND "roles"."builtin" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("role_id");