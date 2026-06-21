var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/utils/error.ts
function handleGithubApiError(error) {
  if (error.response) {
    const status = error.response.status;
    if (status === 404) {
      throw new GithubApiError("User not found", 404);
    }
    if (status === 403 || status === 429) {
      const resetHeader = error.response?.headers["x-ratelimit-reset"];
      const resetMsg = resetHeader ? ` Rate limit resets after ${new Date(parseInt(resetHeader) * 1e3).toLocaleString()}. ` : "";
      throw new GithubApiError(`Github Api Rate Limit Exceeded.${resetMsg}Consider adding a new API token.`, status);
    }
    throw new GithubApiError(`Github API Error: ${error.response.statusText}`, status);
  }
  if (error.request) {
    throw new GithubApiError("No response received from GitHub API. Please check your network connection.", 503);
  }
  throw new GithubApiError(`Unexpected error in setting up the request: ${error.message}`, 500);
}
var GithubServiceError, GithubApiError, ValidationError, ServerError;
var init_error = __esm({
  "src/utils/error.ts"() {
    "use strict";
    GithubServiceError = class {
      message;
      status;
      constructor(message, status) {
        this.status = status;
        this.message = `[GithubServiceError]: ${message}`;
      }
    };
    GithubApiError = class {
      message;
      status;
      error;
      constructor(message, status) {
        this.message = `[GithubApiError]: ${message}`;
        this.status = status;
      }
    };
    ValidationError = class {
      message;
      status;
      constructor(message) {
        this.status = 400;
        this.message = `[ValidationError]: ${message}`;
      }
    };
    ServerError = class {
      message;
      status;
      constructor(message, status) {
        this.status = status;
        this.message = `[ServerError]: ${message}`;
      }
    };
  }
});

// src/config/config.ts
import { config } from "dotenv";
var CONFIG, SECRETS;
var init_config = __esm({
  "src/config/config.ts"() {
    "use strict";
    config();
    CONFIG = {
      PORT: Number(process.env.PORT) || 3e3,
      GITHUB_API_BASE_URL: process.env.GITHUB_API_BASE_URL || "https://api.github.com",
      GITHUB_PROFILE_CACHE_TTL: Number(process.env.GITHUB_PROFILE_CACHE_TTL),
      ENV: process.env.NODE_ENV
    };
    SECRETS = {
      DATABASE_URL: process.env.DATABASE_URL || "mysql://root:root@localhost:3306/github_analyzer",
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || "ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    };
  }
});

// src/database/schema.ts
import { int, varchar, datetime, mysqlTable, boolean, json, decimal } from "drizzle-orm/mysql-core";
import { timestamp } from "drizzle-orm/mysql-core";
var githubProfile;
var init_schema = __esm({
  "src/database/schema.ts"() {
    "use strict";
    githubProfile = mysqlTable("github_profile", {
      githubId: int("github_id").primaryKey(),
      username: varchar("username", { length: 255 }).notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      avatarUrl: varchar("avatar_url", { length: 255 }).notNull(),
      profileUrl: varchar("profile_url", { length: 255 }).notNull(),
      bio: varchar("bio", { length: 255 }).notNull(),
      company: varchar("company", { length: 255 }),
      location: varchar("location", { length: 255 }).notNull(),
      blog: varchar("blog", { length: 255 }).notNull(),
      twitterUsername: varchar("twitter_username", { length: 255 }),
      email: varchar("email", { length: 255 }).notNull(),
      hireable: boolean("hireable").notNull(),
      publicRepos: int("public_repos").notNull(),
      publicGists: int("public_gists").notNull(),
      followers: int("followers").notNull(),
      following: int("following").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
      githubCreatedAt: datetime("github_created_at").notNull(),
      githubUpdatedAt: datetime("github_updated_at").notNull(),
      totalStars: int("total_stars").notNull(),
      totalForks: int("total_forks").notNull(),
      totalWatchers: int("total_watchers").notNull(),
      topLanguage: varchar("top_language", { length: 255 }).notNull(),
      languageBreakdown: json("language_breakdown").notNull(),
      mostStarredRepo: varchar("most_starred_repo", { length: 255 }),
      mostStarredRepoStars: int("most_starred_repo_stars").notNull(),
      accountAgeDays: int("account_age_days").notNull(),
      followersToFollowingRatio: decimal("followers_to_following_ratio", { precision: 10, scale: 2 }).notNull(),
      activityScore: decimal("activity_score", { precision: 12, scale: 2 }).notNull(),
      analyzedAt: datetime("analyzed_at").notNull()
    });
  }
});

// src/database/client.ts
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { eq } from "drizzle-orm";
var DatabaseClient, databaseClient;
var init_client = __esm({
  "src/database/client.ts"() {
    "use strict";
    init_config();
    init_schema();
    DatabaseClient = class {
      pool = createPool({
        uri: SECRETS.DATABASE_URL,
        connectionLimit: 10
      });
      instance = drizzle(this.pool);
      /**
       * Create or update a GitHub profile in the database
       * @param profile - GitHub profile data to insert/update
       */
      async createGithubProfile(profile) {
        const { githubId, ...updatedProfile } = profile;
        return await this.instance.insert(githubProfile).values(profile).onDuplicateKeyUpdate({
          set: updatedProfile
        });
      }
      /**
       * Find a GitHub profile by username
       * @param username - GitHub username to search for
       */
      async findGithubProfileByUsername(username) {
        return this.instance.select().from(githubProfile).where(eq(githubProfile.username, username)).limit(1);
      }
      /**
       * Delete a GitHub profile by username
       * @param username - GitHub username to delete
       */
      async deleteGithubProfileByUsername(username) {
        return this.instance.delete(githubProfile).where(eq(githubProfile.username, username));
      }
      /**
       * Find paginated GitHub profiles
       * @param perPage - Number of profiles per page
       * @param offset - Pagination offset
       */
      async findGithubProfiles(perPage, offset) {
        return this.instance.select().from(githubProfile).limit(perPage).offset(offset);
      }
      /**
       * Test database connectivity
       */
      async connectDB() {
        const connection = await this.pool.getConnection();
        try {
          await connection.ping();
        } finally {
          connection.release();
        }
      }
    };
    databaseClient = new DatabaseClient();
  }
});

// src/services/github.service.ts
import axios from "axios";
var GithubService;
var init_github_service = __esm({
  "src/services/github.service.ts"() {
    "use strict";
    init_error();
    init_client();
    init_config();
    GithubService = class {
      headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Github-Profile-Analyzer",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
      };
      githubClient = axios.create({
        baseURL: "https://api.github.com",
        headers: this.headers,
        timeout: 1e4
      });
      /**
       * Fetch GitHub user profile data
       * @param username - GitHub username
       */
      async _fetchGithubProfile(username) {
        try {
          const { data } = await this.githubClient.get(
            `/users/${encodeURIComponent(username)}`
          );
          return {
            githubId: data.id,
            name: data.name || "N/A",
            username: data.login,
            followers: data.followers,
            following: data.following,
            publicRepos: data.public_repos,
            publicGists: data.public_gists,
            githubCreatedAt: new Date(data.created_at),
            githubUpdatedAt: new Date(data.updated_at),
            avatarUrl: data.avatar_url,
            bio: data.bio || "N/A",
            company: data.company || "N/A",
            location: data.location || "N/A",
            blog: data.blog,
            twitterUsername: data.twitter_username || "N/A",
            profileUrl: data.html_url,
            email: data.email || "N/A",
            hireable: data.hireable ? false : true
          };
        } catch (error) {
          handleGithubApiError(error);
        }
      }
      /**
       * Fetch all repositories for a user (paginated)
       * @param username - GitHub username
       */
      async _fetchGithubRepos(username) {
        const perPage = 100;
        let page = 1;
        let repos = [];
        while (true) {
          try {
            const response = await this.githubClient.get(
              `/users/${encodeURIComponent(username)}/repos`,
              {
                params: {
                  per_page: perPage,
                  page,
                  sort: "updated"
                }
              }
            );
            const data = response.data;
            repos = repos.concat(data);
            if (data.length < perPage) {
              break;
            }
            page++;
            if (page > 10) break;
          } catch (err) {
            handleGithubApiError(err);
          }
        }
        return repos.map((repo) => ({
          name: repo.name,
          stargazersCount: repo.stargazers_count,
          forksCount: repo.forks_count,
          watchersCount: repo.watchers_count,
          language: repo.language
        }));
      }
      /**
       * Compute analytics and insights from profile and repository data
       * @param profileData - User profile data
       * @param repos - User repositories
       */
      _computeInsights(profileData, repos) {
        let totalStars = 0;
        let totalForks = 0;
        let totalWatchers = 0;
        let mostStarredRepo = null;
        let mostStarredRepoStars = 0;
        const languageCounts = {};
        for (const repo of repos) {
          totalStars += repo.stargazersCount;
          totalForks += repo.forksCount;
          totalWatchers += repo.watchersCount;
          if (repo.language) {
            languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
          }
          if ((repo.stargazersCount || 0) > mostStarredRepoStars) {
            mostStarredRepoStars = repo.stargazersCount || 0;
            mostStarredRepo = repo.name;
          }
        }
        const topLanguage = Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";
        const accountCreated = new Date(profileData.githubCreatedAt);
        const accountAgeDays = Math.floor(
          (Date.now() - accountCreated.getTime()) / (1e3 * 60 * 60 * 24)
        );
        const followersToFollowingRatio = String(profileData.following > 0 ? profileData.followers / profileData.following : profileData.followers);
        const activityScore = String(
          Number(
            (profileData.publicRepos * 1 + profileData.followers * 2 + totalStars * 3 + totalForks * 1.5).toFixed(2)
          )
        );
        return {
          totalStars,
          totalForks,
          totalWatchers,
          mostStarredRepo,
          mostStarredRepoStars,
          topLanguage,
          accountAgeDays,
          languageBreakdown: languageCounts,
          followersToFollowingRatio,
          activityScore
        };
      }
      /**
       * Get profile data and insights for a user
       * @param username - GitHub username
       */
      async _getGithubProfileInsights(username) {
        const profileData = await this._fetchGithubProfile(username);
        const repos = await this._fetchGithubRepos(username);
        const insights = this._computeInsights(profileData, repos);
        return {
          profileData,
          insights,
          repos
        };
      }
      /**
       * Check if cached profile is still fresh
       * @param analyzedAt - Profile analysis timestamp
       */
      isFresh(analyzedAt) {
        const ageMinutes = (Date.now() - analyzedAt.getTime()) / (1e3 * 60);
        return ageMinutes < CONFIG.GITHUB_PROFILE_CACHE_TTL;
      }
      /**
       * Analyze or refresh a GitHub profile
       * @param username - GitHub username
       * @param force - Force refresh even if cached
       */
      async analyzeProfile(username, force) {
        if (!force) {
          const existing = await databaseClient.findGithubProfileByUsername(
            username
          );
          if (existing[0] && this.isFresh(existing[0].analyzedAt)) {
            return existing[0];
          }
        }
        const profileInsights = await this._getGithubProfileInsights(username);
        const newEntry = {
          ...profileInsights.profileData,
          ...profileInsights.insights,
          analyzedAt: /* @__PURE__ */ new Date(),
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        await databaseClient.createGithubProfile(newEntry);
        return newEntry;
      }
      /**
       * Get cached GitHub profile
       * @param username - GitHub username
       */
      async getGithubProfile(username) {
        const [profile] = await databaseClient.findGithubProfileByUsername(username);
        if (!profile) {
          throw new GithubServiceError(
            `GitHub profile not found for: ${username}`,
            404
          );
        }
        return profile;
      }
      /**
       * Delete cached GitHub profile
       * @param username - GitHub username
       */
      async deleteGithubProfile(username) {
        const res = await databaseClient.deleteGithubProfileByUsername(username);
        if (!res[0].affectedRows) {
          throw new GithubServiceError(
            `GitHub profile not found for: ${username}`,
            404
          );
        }
        return res;
      }
      /**
       * List paginated GitHub profiles
       * @param perPage - Number of profiles per page
       * @param page - Page number (1-indexed)
       */
      async listGithubProfiles(perPage, page) {
        const profiles = await databaseClient.findGithubProfiles(
          perPage,
          (page - 1) * perPage
        );
        if (!profiles.length) {
          throw new GithubServiceError("No GitHub profiles found", 404);
        }
        return {
          profiles,
          perPage,
          page: page + 1
        };
      }
    };
  }
});

// src/controllers/profile.controller.ts
import { matchedData } from "express-validator";
async function analyzeGithubProfile(req, res, next) {
  try {
    const { username } = req.params;
    const { force } = req.query;
    const data = await githubService.analyzeProfile(
      username,
      force ? true : false
    );
    const formattedResponse = formatGithubProfileResponse(data);
    res.status(200).json({
      code: 200,
      data: formattedResponse,
      message: "GitHub profile found and analyzed"
    });
  } catch (e) {
    next(e);
  }
}
async function getGithubProfile(req, res, next) {
  try {
    const { username } = req.params;
    const data = await githubService.getGithubProfile(username);
    const formattedResponse = formatGithubProfileResponse(data);
    res.status(200).json({
      code: 200,
      data: formattedResponse,
      message: "GitHub profile found"
    });
  } catch (e) {
    next(e);
  }
}
async function deleteGithubProfile(req, res, next) {
  try {
    const { username } = req.params;
    await githubService.deleteGithubProfile(username);
    res.status(204).json({
      code: 204,
      data: {
        username
      },
      message: "GitHub profile deleted successfully"
    });
  } catch (e) {
    next(e);
  }
}
function formatGithubProfileResponse(data) {
  return {
    githubId: data.githubId,
    username: data.username,
    name: data.name,
    avatarUrl: data.avatarUrl,
    profileUrl: data.profileUrl,
    bio: data.bio,
    company: data.company,
    location: data.location,
    blog: data.blog,
    twitterUsername: data.twitterUsername,
    email: data.email,
    hireable: data.hireable,
    stats: {
      publicRepos: data.publicRepos,
      publicGists: data.publicGists,
      followers: data.followers,
      following: data.following,
      followerFollowingRatio: data.followersToFollowingRatio
    },
    insights: {
      totalStars: data.totalStars,
      totalForks: data.totalForks,
      totalWatchers: data.totalWatchers,
      topLanguage: data.topLanguage,
      languageBreakdown: data.languageBreakdown,
      mostStarredRepo: data.mostStarredRepo,
      mostStarredRepoStars: data.mostStarredRepoStars,
      accountAgeDays: data.accountAgeDays,
      activityScore: data.activityScore
    },
    githubCreatedAt: data.githubCreatedAt,
    githubUpdatedAt: data.githubUpdatedAt,
    analyzedAt: data.analyzedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}
async function listGithubProfiles(req, res, next) {
  try {
    const { page, per_page } = matchedData(req);
    const profilesData = await githubService.listGithubProfiles(
      Number(per_page),
      Number(page)
    );
    const formattedProfiles = [];
    for (const profile of profilesData.profiles) {
      formattedProfiles.push(formatGithubProfileResponse(profile));
    }
    return res.status(200).json({
      code: 200,
      message: "Profiles found",
      profiles: formattedProfiles,
      perPage: profilesData.perPage,
      nextPage: profilesData.page
    });
  } catch (e) {
    next(e);
  }
}
var githubService;
var init_profile_controller = __esm({
  "src/controllers/profile.controller.ts"() {
    "use strict";
    init_github_service();
    githubService = new GithubService();
  }
});

// src/middlewares/validation.middleware.ts
import { param, query, validationResult } from "express-validator";
function handleValidationError(req, _, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ValidationError(`${errors.array().map((e) => e.msg).join(", ")}`)
    );
  }
  next();
}
var usernamePattern, validateUsername, validatePaginationProps;
var init_validation_middleware = __esm({
  "src/middlewares/validation.middleware.ts"() {
    "use strict";
    init_error();
    usernamePattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
    validateUsername = [
      param("username").trim().notEmpty().withMessage("Username is required").matches(usernamePattern).withMessage("Invalid GitHub username format"),
      handleValidationError
    ];
    validatePaginationProps = [
      query("per_page").default(5).isInt({ min: 5 }).withMessage("Enter a valid numeric 'per_page' query value (minimum 5)").toInt(),
      query("page").default(1).isInt({ min: 1 }).withMessage("Enter a valid numeric 'page' query value (minimum 1)").toInt(),
      handleValidationError
    ];
  }
});

// src/routes/profile.routes.ts
import { Router } from "express";
var profileRouter;
var init_profile_routes = __esm({
  "src/routes/profile.routes.ts"() {
    "use strict";
    init_profile_controller();
    init_validation_middleware();
    profileRouter = Router();
    profileRouter.get("/analyze/:username", validateUsername, analyzeGithubProfile);
    profileRouter.get("/list", validatePaginationProps, listGithubProfiles);
    profileRouter.get("/:username", validateUsername, getGithubProfile);
    profileRouter.delete("/:username", validateUsername, deleteGithubProfile);
  }
});

// src/utils/logger.ts
var logger;
var init_logger = __esm({
  "src/utils/logger.ts"() {
    "use strict";
    logger = {
      info(message) {
        console.log(
          `[${(/* @__PURE__ */ new Date()).toISOString()}] [INFO] ${message}`
        );
      },
      err(message) {
        console.error(
          `[${(/* @__PURE__ */ new Date()).toISOString()}] [ERROR] ${message}`
        );
      }
    };
  }
});

// src/middlewares/error.middleware.ts
function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    res.status(err.status).json({
      source: "validation",
      message: err.message,
      code: err.status
    });
    return;
  }
  if (err instanceof GithubApiError) {
    res.status(err.status).json({
      source: "github_api",
      message: err.message,
      code: err.status
    });
    return;
  }
  if (err instanceof GithubServiceError) {
    res.status(err.status).json({
      source: "github_service",
      message: err.message,
      code: err.status
    });
    return;
  }
  if (err instanceof ServerError) {
    res.status(err.status).json({
      source: "gateway",
      message: err.message,
      code: err.status
    });
    return;
  }
  res.status(500).json({
    code: 500,
    message: "[ServerError]: Internal Server Error",
    source: "unknown"
  });
  logger.err(`[UNEXPECT_ERR_OCCURED] : ${JSON.stringify(err, null, 2)}`);
}
function routeNotFoundHandler(req, res) {
  res.status(404).json({
    code: 404,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
    source: "gateway"
  });
}
var init_error_middleware = __esm({
  "src/middlewares/error.middleware.ts"() {
    "use strict";
    init_error();
    init_logger();
  }
});

// src/app.ts
import express from "express";
import { rateLimit } from "express-rate-limit";
import morgan from "morgan";
import cors from "cors";
var app, apiLimiter, app_default;
var init_app = __esm({
  "src/app.ts"() {
    "use strict";
    init_profile_routes();
    init_error_middleware();
    init_error();
    init_config();
    app = express();
    app.set("trust proxy", 1);
    apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1e3,
      limit: 200,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_, res, next) => {
        next(
          new ServerError(
            `Rate limit exceeded, please try after ${res.getHeader("Retry-After") ?? "some time"}`,
            429
          )
        );
      }
    });
    app.use(express.json());
    app.use(cors());
    app.use(morgan(CONFIG.ENV === "dev" ? "dev" : "combined"));
    app.get("/", (_, res) => {
      res.json({
        name: "GitHub Profile Analyzer API",
        status: "running",
        docs: {
          analyze: "GET /api/v1/profiles/analyze/:username",
          list: "GET /api/v1/profiles/list",
          getOne: "GET /api/v1/profiles/:username",
          delete: "DELETE /api/v1/profiles/:username"
        }
      });
    });
    app.get("/health", (_, res) => {
      res.status(200).json({
        code: 200,
        message: "running",
        source: "gateway",
        uptime: process.uptime()
      });
    });
    app.use("/api/v1/profiles/", apiLimiter, profileRouter);
    app.use(errorHandler);
    app.use(routeNotFoundHandler);
    app_default = app;
  }
});

// src/server.ts
import { createServer } from "http";
var require_server = __commonJS({
  "src/server.ts"() {
    init_app();
    init_config();
    init_client();
    init_logger();
    var server = createServer(app_default);
    async function start() {
      try {
        await databaseClient.connectDB();
        logger.info(`DATABASE_CONNECTED`);
      } catch (e) {
        logger.err(`DATABASE_CONNECTION_FAILED ${JSON.stringify(e, null, 2)}`);
        process.exit(1);
      }
      server.listen(CONFIG.PORT, () => {
        logger.info(`SERVER_RUNNING_ON: http://localhost:${CONFIG.PORT}`);
      });
      server.on("error", (e) => {
        logger.err(`ERROR_OCCURED_IN_SERVER_STARTUP :${JSON.stringify(e, null, 2)}`);
        process.exit(1);
      });
    }
    start();
  }
});
export default require_server();
//# sourceMappingURL=server.mjs.map