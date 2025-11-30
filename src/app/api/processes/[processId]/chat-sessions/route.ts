import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

async function verifyProcessAccess(processId: string, userId: string) {
  const process = await db.process.findUnique({
    where: { id: processId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  });

  return process && process.project.workspace.members.length > 0;
}

export async function GET(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const hasAccess = await verifyProcessAccess(
      params.processId,
      session.user.id
    );
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this process');
    }

    // Get the most recent chat session for this process with its messages
    const chatSession = await db.chatSession.findFirst({
      where: { processId: params.processId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ok({ chatSession });
  } catch (error) {
    logError('Get chat session', error, { processId: params.processId });
    return CommonErrors.internalError('Failed to load chat session');
  }
}

export async function POST(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const hasAccess = await verifyProcessAccess(
      params.processId,
      session.user.id
    );
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this process');
    }

    const chatSession = await db.chatSession.create({
      data: {
        processId: params.processId,
      },
    });

    return ok({ chatSession });
  } catch (error) {
    logError('Create chat session', error, { processId: params.processId });
    return CommonErrors.internalError('Failed to create chat session');
  }
}
