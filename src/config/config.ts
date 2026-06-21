import {config} from "dotenv"
config()
export const CONFIG = {
   PORT: Number(process.env.PORT) || 3000,
   GITHUB_API_BASE_URL: process.env.GITHUB_API_BASE_URL || "https://api.github.com",
   GITHUB_PROFILE_CACHE_TTL:Number(process.env.GITHUB_PROFILE_CACHE_TTL),
   ENV:process.env.NODE_ENV
} as const

export const SECRETS = {
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/github_profile_analyzer",
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || "ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
} as const
