import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors, error, ErrorCodes } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { orchestrate } from '@/lib/orchestration/router';
import { OrchestrationContext } from '@/lib/orchestration/types';
import { z } from 'zod';

const orchestrateSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

/**
 * POST /api/sessions/[sessionId]/orchestrate
 *
 * Main orchestration endpoint that processes user messages and executes appropriate actions.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const { sessionId } = params;

    // Verify session exists and user has access
    const assistantSession = await db.assistantSession.findUnique({
      where: { id: sessionId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!assistantSession || assistantSession.workspace.members.length === 0) {
      return CommonErrors.notFound('Session');
    }

    // Parse and validate request body
    const body = await req.json();
    const { message } = orchestrateSchema.parse(body);

    // Build orchestration context
    const currentMetadata = (assistantSession.metadata as any) || {};

    // Fetch recent conversation history from database (last 30 messages)
    const recentMessages = await db.sessionMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        role: true,
        content: true,
        createdAt: true,
      },
    });

    // Reverse to get chronological order (oldest first)
    const conversationHistory: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }> = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

    const context: OrchestrationContext = {
      sessionId: assistantSession.id,
      workspaceId: assistantSession.workspaceId,
      userId: session.user.id,
      currentMetadata: {
        projectId: currentMetadata.projectId,
        processIds: currentMetadata.processIds || [],
        opportunityIds: currentMetadata.opportunityIds || [],
        blueprintIds: currentMetadata.blueprintIds || [],
        aiUseCaseIds: currentMetadata.aiUseCaseIds || [],
      },
      conversationHistory,
    };

    // Execute orchestration
    const result = await orchestrate(context, message);

    if (!result.success) {
      return error(
        500,
        ErrorCodes.INTERNAL_ERROR,
        result.error || 'Orchestration failed'
      );
    }

    // M14: Save chat messages to database
    await db.sessionMessage.createMany({
      data: [
        {
          sessionId,
          role: 'user',
          content: message,
        },
        {
          sessionId,
          role: 'assistant',
          content: result.assistantMessage,
        },
      ],
    });

    // Update session metadata with new artifact IDs
    await db.assistantSession.update({
      where: { id: sessionId },
      data: {
        metadata: result.updatedMetadata,
      },
    });

    // M14: Include clarification and nextStepSuggestion if present
    return ok({
      assistantMessage: result.assistantMessage,
      artifacts: result.artifacts,
      updatedMetadata: result.updatedMetadata,
      clarification: result.clarification, // M14: Clarification request
      nextStepSuggestion: result.nextStepSuggestion, // M14: Next step hint
      ui: result.ui, // UI hints for client (e.g., expand all sections)
    });
  } catch (err: any) {
    logError('Orchestrate session', err, { sessionId: params.sessionId });

    // Check for validation errors
    if (err instanceof z.ZodError) {
      return CommonErrors.invalidInput(err.errors[0]?.message || 'Invalid input');
    }

    // Check if it's an LLM-specific error
    if (err instanceof Error && err.message.includes('LLM')) {
      return error(
        500,
        ErrorCodes.LLM_FAILED,
        'The AI service encountered an error. Please try again.'
      );
    }

    return CommonErrors.internalError('Failed to process message');
  }
}
