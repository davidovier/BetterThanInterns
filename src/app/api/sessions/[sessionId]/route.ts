import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  contextSummary: z.string().optional(),
  metadata: z.any().optional(),
});

/**
 * GET /api/sessions/[sessionId]
 * Get session by ID
 */
export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const assistantSession = await db.assistantSession.findUnique({
      where: {
        id: params.sessionId,
      },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!assistantSession || assistantSession.workspace.members.length === 0) {
      return CommonErrors.notFound('Session');
    }

    return ok({ session: assistantSession });
  } catch (error) {
    logError('Get session', error, { sessionId: params.sessionId });
    return CommonErrors.internalError('Failed to load session');
  }
}

/**
 * PATCH /api/sessions/[sessionId]
 * Update session
 */
export async function PATCH(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify session exists and user has access
    const existingSession = await db.assistantSession.findUnique({
      where: {
        id: params.sessionId,
      },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!existingSession || existingSession.workspace.members.length === 0) {
      return CommonErrors.notFound('Session');
    }

    const body = await req.json();
    const data = updateSessionSchema.parse(body);

    const updatedSession = await db.assistantSession.update({
      where: {
        id: params.sessionId,
      },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.contextSummary !== undefined && { contextSummary: data.contextSummary }),
        ...(data.metadata && { metadata: data.metadata }),
      },
    });

    return ok({ session: updatedSession });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Update session', error, { sessionId: params.sessionId });
    return CommonErrors.internalError('Failed to update session');
  }
}

/**
 * DELETE /api/sessions/[sessionId]
 * Delete session
 */
export async function DELETE(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify session exists and user has access
    const existingSession = await db.assistantSession.findUnique({
      where: {
        id: params.sessionId,
      },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!existingSession || existingSession.workspace.members.length === 0) {
      return CommonErrors.notFound('Session');
    }

    await db.assistantSession.delete({
      where: {
        id: params.sessionId,
      },
    });

    return ok({ success: true });
  } catch (error) {
    logError('Delete session', error, { sessionId: params.sessionId });
    return CommonErrors.internalError('Failed to delete session');
  }
}
