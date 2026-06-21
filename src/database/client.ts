/**
 * Database client for GitHub profile operations.
 * Handles CRUD operations for cached GitHub profiles.
 */
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { SECRETS } from "@/config/config";
import { eq } from "drizzle-orm";
import { githubProfile, GithubProfileDBType } from "./schema";

/**
 * Database client class for managing GitHub profile data
 */
export class DatabaseClient {
  private pool = createPool({
    uri: SECRETS.DATABASE_URL,
    connectionLimit: 10,
  });

  private instance = drizzle(this.pool);

  /**
   * Create or update a GitHub profile in the database
   * @param profile - GitHub profile data to insert/update
   */
  async createGithubProfile(profile: GithubProfileDBType) {
    const { githubId, ...updatedProfile } = profile;
    return await this.instance
      .insert(githubProfile)
      .values(profile)
      .onDuplicateKeyUpdate({
        set: updatedProfile,
      });
  }

  /**
   * Find a GitHub profile by username
   * @param username - GitHub username to search for
   */
  async findGithubProfileByUsername(username: string) {
    return this.instance
      .select()
      .from(githubProfile)
      .where(eq(githubProfile.username, username))
      .limit(1);
  }

  /**
   * Delete a GitHub profile by username
   * @param username - GitHub username to delete
   */
  async deleteGithubProfileByUsername(username: string) {
    return this.instance
      .delete(githubProfile)
      .where(eq(githubProfile.username, username));
  }

  /**
   * Find paginated GitHub profiles
   * @param perPage - Number of profiles per page
   * @param offset - Pagination offset
   */
  async findGithubProfiles(perPage: number, offset: number) {
    return this.instance
      .select()
      .from(githubProfile)
      .limit(perPage)
      .offset(offset);
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
}

export const databaseClient = new DatabaseClient();