import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { answerQuestion, ingestVideo, isIngested } from "../rag";

const videoId = z.string().regex(/^[\w-]{11}$/, "Invalid YouTube video id");

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: "ok" })),

  ingest: publicProcedure.input(z.object({ videoId })).mutation(async ({ input }) => {
    try {
      return await ingestVideo(input.videoId);
    } catch (err) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Could not ingest video: ${(err as Error).message}`,
      });
    }
  }),

  ask: publicProcedure
    .input(z.object({ videoId, query: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ input }) => {
      if (!(await isIngested(input.videoId))) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ingest the video first" });
      }
      return answerQuestion(input.videoId, input.query);
    }),
});

export type AppRouter = typeof appRouter;
