/**
 * /api/ai/chat/route.ts — SoloSpot AI Server-Side Chat Endpoint
 *
 * Dedicated server endpoint for SoloSpot AI Co-Builder via OpenCode.
 * Delegates directly to the copilot API handler.
 */

export { POST, GET } from '@/app/api/builder/copilot/route';
