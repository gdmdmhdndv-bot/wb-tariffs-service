import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),

    POSTGRES_HOST: z.string().default("localhost"),
    POSTGRES_PORT: z
        .string()
        .regex(/^\d+$/)
        .transform((v) => parseInt(v))
        .default("5432"),
    POSTGRES_DB: z.string().default("postgres"),
    POSTGRES_USER: z.string().default("postgres"),
    POSTGRES_PASSWORD: z.string().default("postgres"),

    WB_API_TOKEN: z.string().min(1, "WB_API_TOKEN is required"),

    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email("Invalid service account email"),
    GOOGLE_PRIVATE_KEY: z.string().min(1, "GOOGLE_PRIVATE_KEY is required"),
    GOOGLE_SPREADSHEET_IDS: z
        .string()
        .min(1, "At least one spreadsheet ID is required")
        .transform((v) =>
            v
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean),
        ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
