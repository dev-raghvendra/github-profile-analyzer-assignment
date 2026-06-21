/**
 * Profile controller handlers for GitHub profile operations.
 * Handles requests for analyzing, retrieving, listing, and deleting profiles.
 */
import { GithubService } from "@/services/github.service";
import { Response, NextFunction } from "express";
import { PopulatedRequest } from "@/types/request";
import { GithubProfileDBType } from "@/database/schema";
import { matchedData } from "express-validator";

const githubService = new GithubService();

/**
 * Analyze and cache a GitHub user profile
 * @param req - Express request with username param
 * @param res - Express response
 * @param next - Express next middleware
 */
export async function analyzeGithubProfile(
  req: PopulatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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
      message: "GitHub profile found and analyzed",
    });
  } catch (e) {
    next(e);
  }
}

/**
 * Retrieve a cached GitHub profile
 * @param req - Express request with username param
 * @param res - Express response
 * @param next - Express next middleware
 */
export async function getGithubProfile(
  req: PopulatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { username } = req.params;
    const data = await githubService.getGithubProfile(username);
    const formattedResponse = formatGithubProfileResponse(data);
    res.status(200).json({
      code: 200,
      data: formattedResponse,
      message: "GitHub profile found",
    });
  } catch (e) {
    next(e);
  }
}

/**
 * Delete a cached GitHub profile
 * @param req - Express request with username param
 * @param res - Express response
 * @param next - Express next middleware
 */
export async function deleteGithubProfile(
  req: PopulatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { username } = req.params;
    await githubService.deleteGithubProfile(username);
    res.status(204).json({
      code: 204,
      data: {
        username,
      },
      message: "GitHub profile deleted successfully",
    });
  } catch (e) {
    next(e);
  }
}

/**
 * Format GitHub profile database record to API response format
 * @param data - Database profile record
 */
function formatGithubProfileResponse(data: GithubProfileDBType) {
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
      followerFollowingRatio: data.followersToFollowingRatio,
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
      activityScore: data.activityScore,
    },
    githubCreatedAt: data.githubCreatedAt,
    githubUpdatedAt: data.githubUpdatedAt,
    analyzedAt: data.analyzedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * List paginated cached GitHub profiles
 * @param req - Express request with pagination query params
 * @param res - Express response
 * @param next - Express next middleware
 */
export async function listGithubProfiles(
  req: PopulatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { page, per_page } = matchedData(req);
    const profilesData = await githubService.listGithubProfiles(
      Number(per_page),
      Number(page)
    );
    const formattedProfiles: ReturnType<typeof formatGithubProfileResponse>[] =
      [];
    for (const profile of profilesData.profiles) {
      formattedProfiles.push(formatGithubProfileResponse(profile));
    }
    return res.status(200).json({
      code: 200,
      message: "Profiles found",
      profiles: formattedProfiles,
      perPage: profilesData.perPage,
      nextPage: profilesData.page,
    });
  } catch (e: any) {
    next(e);
  }
}