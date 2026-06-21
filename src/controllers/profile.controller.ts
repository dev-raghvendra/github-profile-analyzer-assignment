import { GithubService } from "@/services/github.service";
import { Response, NextFunction } from "express";
import { PopulatedRequest } from "@/types/request";
import { GithubProfileDBType } from "@/database/schema";

const githubService = new GithubService();

export async function analyzeGithubProfile(req: PopulatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const {username} = req.params
        const {force} = req.query
        const data = await githubService.analyzeProfile(username,force ? true : false)
        const formattedResponse = formatGithubProfileResponse(data)
        res.status(200).json({
            code:200,
            data:formattedResponse,
            message:"Github Profile Found"
        })
    } catch (e) {
        next(e);
    }
}

export async function getGithubProfile(req:PopulatedRequest,res:Response, next:NextFunction){
    try {
        const {username} = req.params
        const data = await githubService.getGithubProfile(username)
        const formattedResponse = formatGithubProfileResponse(data)
        res.status(200).json({
            code:200,
            data:formattedResponse,
            message:"Github Profile Found"
        })
    } catch (e) {
        next(e)
    }
}

export async function deleteGithubProfile(req:PopulatedRequest,res:Response, next:NextFunction){
    try {
        const {username} = req.params
        await githubService.deleteGithubProfile(username)
        res.status(204).json({
            code:204,
            data:{
                username
            },
            message:"Github Profile Found"
        })
    } catch (e) {
        next(e)
    }
}


function formatGithubProfileResponse(data:GithubProfileDBType){
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
    hireable: data.hireable ,
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
      languageBreakdown:data.languageBreakdown,
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
    }
}