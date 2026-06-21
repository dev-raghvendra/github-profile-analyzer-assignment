import {int,varchar,datetime,mysqlTable,boolean,json,decimal} from "drizzle-orm/mysql-core";
import {InferSelectModel, sql} from "drizzle-orm";
import { timestamp } from "drizzle-orm/mysql-core";

export const githubProfile = mysqlTable("github_profile",{
    githubId: int("github_id").primaryKey(),
    username:varchar("username", {length: 255}).notNull(),
    name:varchar("name", {length: 255}).notNull(),
    avatarUrl:varchar("avatar_url", {length: 255}).notNull(),
    profileUrl:varchar("profile_url", {length: 255}).notNull(),
    bio:varchar("bio", {length: 255}).notNull(),
    company:varchar("company", {length: 255}),
    location:varchar("location",{length:255}).notNull(),
    blog:varchar("blog",{length:255}).notNull(),
    twitterUsername:varchar("twitter_username",{length:255}),
    email:varchar("email",{length:255}).notNull(),
    hireable:boolean("hireable").notNull(),
    publicRepos:int("public_repos").notNull(),
    publicGists:int("public_gists").notNull(),
    followers:int("followers").notNull(),
    following:int("following").notNull(),
    createdAt:timestamp("created_at").defaultNow().notNull(),
    updatedAt:timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
    githubCreatedAt:datetime("github_created_at").notNull(),
    githubUpdatedAt:datetime("github_updated_at").notNull(),
    totalStars:int("total_stars").notNull(),
    totalForks:int("total_forks").notNull(),
    totalWatchers:int("total_watchers").notNull(),
    topLanguage:varchar("top_language",{length:255}).notNull(),
    languageBreakdown:json("language_breakdown").notNull(),
    mostStarredRepo:varchar("most_starred_repo",{length:255}),
    mostStarredRepoStars:int("most_starred_repo_stars").notNull(),
    accountAgeDays:int("account_age_days").notNull(),
    followersToFollowingRatio:decimal("followers_to_following_ratio",{precision:10,scale:2}).notNull(),
    activityScore:decimal("activity_score",{precision:12,scale:2}).notNull(),
    analyzedAt:datetime("analyzed_at").notNull(),
})

export type GithubProfileDBType = typeof githubProfile.$inferInsert