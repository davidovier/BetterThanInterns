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

    // Get recent conversation history (placeholder - would be stored in DB in production)
    const conversationHistory: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }> = [];

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

    // Update session metadata with new artifact IDs
    await db.assistantSession.update({
      where: { id: sessionId },
      data: {
        metadata: result.updatedMetadata,
        linkedProjectId: result.updatedMetadata.projectId || assistantSession.linkedProjectId,
      },
    });

    return ok({
      assistantMessage: result.assistantMessage,
      artifacts: result.artifacts,
      updatedMetadata: result.updatedMetadata,
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
