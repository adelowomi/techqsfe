import { TRPCError } from "@trpc/server";
import {
  createCardSchema,
  updateCardSchema,
  cardIdSchema,
  drawCardSchema,
  getCardsByDeckSchema,
} from "~/lib/validations";
import { createTRPCRouter, protectedProcedure, producerProcedure, adminProcedure } from "~/server/api/trpc";
import { CardService, DeckFullError, DeckEmptyError, CardNotFoundError, DuplicateCardNumberError } from "~/server/services";

export const cardRouter = createTRPCRouter({
  create: producerProcedure
    .input(createCardSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await CardService.createCard(input);
      } catch (error) {
        if (error instanceof DeckFullError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        if (error instanceof DuplicateCardNumberError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create card",
          cause: error,
        });
      }
    }),

  getByDeck: protectedProcedure
    .input(getCardsByDeckSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await CardService.getCardsByDeck(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cards",
          cause: error,
        });
      }
    }),

  getById: protectedProcedure
    .input(cardIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        const card = await CardService.getCardById(input.id);
        if (!card) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Card not found",
          });
        }
        return card;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch card",
          cause: error,
        });
      }
    }),

  update: producerProcedure
    .input(updateCardSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const card = await CardService.updateCard(input);
        if (!card) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Card not found",
          });
        }
        return card;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update card",
          cause: error,
        });
      }
    }),

  delete: adminProcedure
    .input(cardIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const deleted = await CardService.deleteCard(input.id);
        if (!deleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Card not found",
          });
        }
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete card",
          cause: error,
        });
      }
    }),

  drawRandom: protectedProcedure
    .input(drawCardSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await CardService.drawRandomCard(input);
      } catch (error) {
        if (error instanceof DeckEmptyError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to draw card",
          cause: error,
        });
      }
    }),

  getDeckStatus: protectedProcedure
    .input(drawCardSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await CardService.getDeckStatus(input.seasonId, input.difficulty);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch deck status",
          cause: error,
        });
      }
    }),
});