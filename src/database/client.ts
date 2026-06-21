
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { SECRETS } from "@/config/config"
import { eq } from "drizzle-orm"
import { githubProfile,  GithubProfileDBType } from "./schema"
export class DatabaseClient { 
    private pool = createPool({
            uri:SECRETS.DATABASE_URL,
            connectionLimit:10
    })
    private instance = drizzle(
        this.pool
    )
    
    async createGithubProfile(profile:GithubProfileDBType){
        const {githubId,...updatedProfile} = profile
          return await this.instance.insert(githubProfile).values(profile).onDuplicateKeyUpdate({
            set: updatedProfile
        })
    }

    async findGithubProfileByUsername(username:string){
        return this.instance.select().from(githubProfile).where(eq(githubProfile.username, username)).limit(1)
    }

    async deleteGithubProfileByUsername(username:string){
        return this.instance.delete(githubProfile).where(eq(githubProfile.username,username))
    }

    async connectDB(){
        const connection = await this.pool.getConnection()
        try {
            await connection.ping()
        } finally {
            connection.release()
        }
    }
}

export const databaseClient = new DatabaseClient()