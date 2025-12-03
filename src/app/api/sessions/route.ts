import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { initializeSessionMetadata } from '@/lib/sessions';

const createSessionSchema = z.object({
  title: z.string().min(1),
  workspaceId: z.string().min(1),
  linkedProjectId: z.string().optional(),
});

/**
 * GET /api/sessions?workspaceId=xxx
 * List all sessions for current workspace
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return CommonErrors.missingRequired('workspaceId');
    }

    // Verify user has access to workspace
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    const sessions = await db.assistantSession.findMany({
      where: {
        workspaceId: workspaceId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return ok({ sessions });
  } catch (error) {
    logError('Get sessions', error, { userId: session?.user?.id });
    return CommonErrors.internalError('Failed to load sessions');
  }
}

/**
 * POST /api/sessions
 * Create new session
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const body = await req.json();
    const data = createSessionSchema.parse(body);

    // Verify user has access to workspace
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: data.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    // If linkedProjectId is provided, verify it exists and belongs to the workspace
    if (data.linkedProjectId) {
      const project = await db.project.findUnique({
        where: {
          id: data.linkedProjectId,
        },
      });

      if (!project || project.workspaceId !== data.workspaceId) {
        return CommonErrors.invalidInput('Invalid project ID');
      }
    }

    const assistantSession = await db.assistantSession.create({
      data: {
        title: data.title,
        workspaceId: data.workspaceId,
        linkedProjectId: data.linkedProjectId,
        metadata: initializeSessionMetadata(),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return ok({ session: assistantSession });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create session', error, { userId: session?.user?.id });
    return CommonErrors.internalError('Failed to create session');
  }
}
