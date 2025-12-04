import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

const updateProcessSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const includeGraph = searchParams.get('includeGraph') === 'true';

    const process = await db.process.findUnique({
      where: { id: params.processId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
        _count: {
          select: {
            steps: true,
            opportunities: true,
          },
        },
        ...(includeGraph && {
          steps: {
            orderBy: { createdAt: 'asc' },
          },
          links: {
            orderBy: { createdAt: 'asc' },
          },
        }),
      },
    });

    if (!process || process.project.workspace.members.length === 0) {
      return CommonErrors.notFound('Process');
    }

    return ok({ process });
  } catch (error) {
    logError('Get process', error, { processId: params.processId });
    return CommonErrors.internalError('Failed to load process');
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify access
    const existingProcess = await db.process.findUnique({
      where: { id: params.processId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (
      !existingProcess ||
      existingProcess.project.workspace.members.length === 0
    ) {
      return CommonErrors.forbidden('You do not have access to this process');
    }

    const body = await req.json();
    const data = updateProcessSchema.parse(body);

    const process = await db.process.update({
      where: { id: params.processId },
      data,
    });

    return ok({ process });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Update process', error, { processId: params.processId });
    return CommonErrors.internalError('Failed to update process');
  }
}
