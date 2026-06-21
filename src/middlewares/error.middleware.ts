import { PopulatedRequest } from "@/types/request";
import {NextFunction, Response} from "express"
import { GithubApiError, GithubServiceError, ServerError, ValidationError } from "@/utils/error";
import { logger } from "@/utils/logger";

export function errorHandler(err:any,req:PopulatedRequest,res:Response,next:NextFunction){
    if(err instanceof ValidationError) {
        res.status(err.status).json({
            source:"validation",
            message:err.message,
            code:err.status
        })
        return
    }

    if(err instanceof GithubApiError) {
        res.status(err.status).json({
            source:"github_api",
            message:err.message,
            code:err.status
        })
        return
    }

    if(err instanceof GithubServiceError) {
        res.status(err.status).json({
            source:"github_service",
            message:err.message,
            code:err.status
        })
        return
    }

    if(err instanceof ServerError) {
        res.status(err.status).json({
            source:"gateway",
            message:err.message,
            code:err.status
        })
        return
    }
    res.status(500).json({
        code:500,
        message:"[ServerError]: Internal Server Error",
        source:"unknown"
    })
    console.log(err.cause)
    logger.err(`[UNEXPECT_ERR_OCCURED] : ${JSON.stringify(err,null,2)}`)
}
export function routeNotFoundHandler(req:PopulatedRequest,res:Response){
    res.status(404).json({
        code:404,
        message:`Route ${req.method} ${req.originalUrl} not found.`,
        source:"gateway"
    })
}