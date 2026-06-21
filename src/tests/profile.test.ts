import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "@/app";

describe("Profiles API", () => {
  describe("GET /api/v1/profiles/:username", () => {
    it("returns profile when found", async () => {
      const res = await request(app)
        .get("/api/v1/profiles/dev-raghvendra");

      expect(res.status).toBe(200);
    });

    it("returns 404 when profile does not exist", async () => {
      const res = await request(app)
        .get("/api/v1/profiles/non-existent");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/profiles/analyze/:username", () => {
    it("returns analysis", async () => {
      const res = await request(app)
        .get("/api/v1/profiles/analyze/dev-raghvendra");

      expect(res.status).toBe(200);
    });

    it("returns 404 when user is not found", async () => {
      const res = await request(app)
        .get("/api/v1/profiles/analyze/unknown-usekgjeroigjoegjigjr");

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/profiles/:username", () => {
    it("deletes profile", async () => {
      const res = await request(app)
        .delete("/api/v1/profiles/dev-raghvendra");

      expect(res.status).toBe(204);
    });

    it("returns 404 when profile does not exist", async () => {
      const res = await request(app)
        .delete("/api/v1/profiles/non-existejgerjgiejgejnt");

      expect(res.status).toBe(404);
    });
  });
});