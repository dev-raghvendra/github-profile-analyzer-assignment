import { Request } from "express";

export interface PopulatedRequest extends Request {
    params: {
        username: string;
    },
    query:{
        force?: string;
    }
}