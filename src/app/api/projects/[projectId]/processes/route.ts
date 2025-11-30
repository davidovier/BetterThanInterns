import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { verifyProjectAccess } from '@/lib/access-control';

const createProcessSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  owner: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify user has access to project
    const hasAccess = await verifyProjectAccess(params.projectId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this project');
    }

    const processes = await db.process.findMany({
      where: { projectId: params.projectId },
      orderBy: { updatedAt: 'desc' },
    });

    return ok({ processes });
  } catch (error) {
    logError('Get processes', error, { projectId: params.projectId });
    return CommonErrors.internalError('Failed to load processes');
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify user has access to project
    const hasAccess = await verifyProjectAccess(params.projectId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this project');
    }

    const body = await req.json();
    const data = createProcessSchema.parse(body);

    const process = await db.process.create({
      data: {
        ...data,
        projectId: params.projectId,
      },
    });

    return ok({ process });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create process', error, { projectId: params.projectId });
    return CommonErrors.internalError('Failed to create process');
  }
}
