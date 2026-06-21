/**
 * GitHub API service for profile analysis and data aggregation.
 * Handles fetching profiles, repositories, and computing insights.
 */
import axios, { AxiosError } from "axios";
import { GithubServiceError, handleGithubApiError } from "@/utils/error";
import { databaseClient } from "@/database/client";
import { CONFIG } from "@/config/config";

/**
 * Repository data interface
 */
export interface Repository {
  name: string;
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  language: string;
}

/**
 * GitHub profile data interface
 */
export interface GithubProfile {
  githubId: number;
  name: string;
  username: string;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  githubCreatedAt: Date;
  githubUpdatedAt: Date;
  avatarUrl: string;
  bio: string;
  company: string;
  location: string;
  blog: string;
  twitterUsername: string;
  profileUrl: string;
  email: string;
  hireable: boolean;
}

/**
 * GitHub API service class
 */
export class GithubService {
  private headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Github-Profile-Analyzer",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  };

  private githubClient = axios.create({
    baseURL: "https://api.github.com",
    headers: this.headers,
    timeout: 10000,
  });

  /**
   * Fetch GitHub user profile data
   * @param username - GitHub username
   */
  private async _fetchGithubProfile(username: string): Promise<GithubProfile> {
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
        hireable: data.hireable ? false : true,
      };
    } catch (error) {
      handleGithubApiError(error as AxiosError);
    }
  }

  /**
   * Fetch all repositories for a user (paginated)
   * @param username - GitHub username
   */
  private async _fetchGithubRepos(username: string): Promise<Repository[]> {
    const perPage = 100;
    let page = 1;
    let repos: any[] = [];

    while (true) {
      try {
        const response = await this.githubClient.get(
          `/users/${encodeURIComponent(username)}/repos`,
          {
            params: {
              per_page: perPage,
              page: page,
              sort: "updated",
            },
          }
        );
        const data = response.data as Repository[];
        repos = repos.concat(data);

        if (data.length < perPage) {
          break;
        }
        page++;
        if (page > 10) break;
      } catch (err) {
        handleGithubApiError(err as AxiosError);
      }
    }

    return repos.map((repo) => ({
      name: repo.name,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      watchersCount: repo.watchers_count,
      language: repo.language,
    }));
  }

  /**
   * Compute analytics and insights from profile and repository data
   * @param profileData - User profile data
   * @param repos - User repositories
   */
  private _computeInsights(profileData: GithubProfile, repos: Repository[]) {
    let totalStars = 0;
    let totalForks = 0;
    let totalWatchers = 0;
    let mostStarredRepo: string | null = null;
    let mostStarredRepoStars = 0;

    const languageCounts: Record<string, number> = {};

    for (const repo of repos) {
      totalStars += repo.stargazersCount;
      totalForks += repo.forksCount;
      totalWatchers += repo.watchersCount;

      if (repo.language) {
        languageCounts[repo.language] =
          (languageCounts[repo.language] || 0) + 1;
      }

      if ((repo.stargazersCount || 0) > mostStarredRepoStars) {
        mostStarredRepoStars = repo.stargazersCount || 0;
        mostStarredRepo = repo.name;
      }
    }

    const topLanguage =
      Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "Unknown";

    const accountCreated = new Date(profileData.githubCreatedAt);
    const accountAgeDays = Math.floor(
      (Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24)
    );

    const followersToFollowingRatio =
      String(profileData.following > 0
        ? profileData.followers / profileData.following
        : profileData.followers);

    const activityScore = String(
      Number(
        (
          profileData.publicRepos * 1 +
          profileData.followers * 2 +
          totalStars * 3 +
          totalForks * 1.5
        ).toFixed(2)
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
      activityScore,
    };
  }

  /**
   * Get profile data and insights for a user
   * @param username - GitHub username
   */
  private async _getGithubProfileInsights(username: string) {
    const profileData = await this._fetchGithubProfile(username);
    const repos = await this._fetchGithubRepos(username);
    const insights = this._computeInsights(profileData, repos);
    return {
      profileData,
      insights,
      repos,
    };
  }

  /**
   * Check if cached profile is still fresh
   * @param analyzedAt - Profile analysis timestamp
   */
  private isFresh(analyzedAt: Date): boolean {
    const ageMinutes = (Date.now() - analyzedAt.getTime()) / (1000 * 60);
    return ageMinutes < CONFIG.GITHUB_PROFILE_CACHE_TTL;
  }

  /**
   * Analyze or refresh a GitHub profile
   * @param username - GitHub username
   * @param force - Force refresh even if cached
   */
  async analyzeProfile(username: string, force: boolean) {
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
      analyzedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await databaseClient.createGithubProfile(newEntry);
    return newEntry;
  }

  /**
   * Get cached GitHub profile
   * @param username - GitHub username
   */
  async getGithubProfile(username: string) {
    const [profile] =
      await databaseClient.findGithubProfileByUsername(username);
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
  async deleteGithubProfile(username: string) {
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
  async listGithubProfiles(perPage: number, page: number) {
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
      page: page + 1,
    };
  }
}
