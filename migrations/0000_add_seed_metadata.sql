CREATE TABLE "seed_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"executed_at" timestamp DEFAULT now(),
	CONSTRAINT "seed_metadata_name_unique" UNIQUE("name")
);
