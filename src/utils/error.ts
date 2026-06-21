import { AxiosError } from "axios";

interface ApiError {
    message : string;
    status: number;
}

export class GithubServiceError implements ApiError {
    message: string;
    status: number;
     constructor(message: string, status: number) {
        this.status = status;
        this.message = `[GithubServiceError]: ${message}`;
    }
}

export class GithubApiError implements ApiError{
    message: string;
    status: number;
    error:any;
    constructor(message:string,status:number){
        this.message = `[GithubApiError]: ${message}`;
        this.status = status
    }
}

export class ValidationError implements ApiError {
    message: string;
    status: number;
    constructor(message: string) {
        this.status = 400;
        this.message = `[ValidationError]: ${message}`;
    }
}

export class ServerError implements ApiError {
    message: string;
    status: number;
    constructor(message: string,status:number) {
        this.status = status;
        this.message = `[ServerError]: ${message}`;
    }
}


export function handleGithubApiError(error:AxiosError):never{
   if(error.response){
     const status = error.response.status;
     console.log(error)
     if(status === 404){
         throw new GithubApiError("User not found", 404);
     }
     if(status === 403 || status === 429){
        const resetHeader = error.response?.headers['x-ratelimit-reset'];
        const resetMsg = resetHeader ? ` Rate limit resets after ${new Date(parseInt(resetHeader) * 1000).toLocaleString()}. ` : '';
        throw new GithubApiError(`Github Api Rate Limit Exceeded.${resetMsg}Consider adding a new API token.` , status);
     }
     throw new GithubApiError(`Github API Error: ${error.response.statusText}`, status);

   }

   if(error.request){
        throw new GithubApiError("No response received from GitHub API. Please check your network connection.", 503);
   }

   throw new GithubApiError(`Unexpected error in setting up the request: ${error.message}`, 500);
}