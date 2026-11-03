CREATE TABLE "bank_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"provider" text DEFAULT 'revolut' NOT NULL,
	"token_hash" text NOT NULL,
	"default_category" text NOT NULL,
	"auto_import" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"rate_window" timestamp with time zone DEFAULT now() NOT NULL,
	"rate_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_connections_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "bank_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bank_merchant_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"merchant" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_merchant_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bank_notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"payload" jsonb,
	"parsed" jsonb,
	"category" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"transaction_id" uuid,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_notification_status" CHECK ("bank_notification_events"."status" IN ('pending','imported','ignored'))
);
--> statement-breakpoint
ALTER TABLE "bank_notification_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_merchant_rules" ADD CONSTRAINT "bank_merchant_rules_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_merchant_rules" ADD CONSTRAINT "bank_merchant_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_notification_events" ADD CONSTRAINT "bank_notification_events_connection_id_bank_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_notification_events" ADD CONSTRAINT "bank_notification_events_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_notification_events" ADD CONSTRAINT "bank_notification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_notification_events" ADD CONSTRAINT "bank_notification_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bank_connections_owner" ON "bank_connections" USING btree ("user_id","group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_merchant_rule_identity" ON "bank_merchant_rules" USING btree ("group_id","user_id","provider","merchant");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_notification_identity" ON "bank_notification_events" USING btree ("account_id","fingerprint");--> statement-breakpoint
CREATE INDEX "bank_notification_inbox" ON "bank_notification_events" USING btree ("user_id","group_id","received_at");
--> statement-breakpoint
-- Device credentials and notification payloads are accessible only to backend roles.
DO $$
DECLARE client_role text;
BEGIN
  REVOKE ALL ON bank_connections, bank_notification_events, bank_merchant_rules FROM PUBLIC;
  FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
      EXECUTE format('REVOKE ALL ON bank_connections, bank_notification_events, bank_merchant_rules FROM %I', client_role);
    END IF;
  END LOOP;
  FOREACH client_role IN ARRAY ARRAY['pool_user', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
      EXECUTE format('GRANT ALL ON bank_connections, bank_notification_events, bank_merchant_rules TO %I', client_role);
    END IF;
  END LOOP;
END $$;
