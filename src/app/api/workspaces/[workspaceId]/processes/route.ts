import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { verifyWorkspaceAccess } from '@/lib/access-control';
import { z } from 'zod';

const createProcessSchema = z.object({
  name: z.string().min(1, 'Process name is required'),
  description: z.string().optional(),
  owner: z.string().optional(),
});

/**
 * GET /api/workspaces/[workspaceId]/processes
 * List all processes in a workspace (across all projects)
 */
export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(params.workspaceId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    // Fetch all processes for this workspace
    const processes = await db.process.findMany({
      where: {
        workspaceId: params.workspaceId,
      },
      include: {
        _count: {
          select: {
            steps: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Format response
    const formattedProcesses = processes.map((process) => ({
      id: process.id,
      name: process.name,
      description: process.description,
      owner: process.owner,
      stepCount: process._count.steps,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
    }));

    return ok({ processes: formattedProcesses });
  } catch (error) {
    logError('List processes', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to load processes');
  }
}

/**
 * POST /api/workspaces/[workspaceId]/processes
 * Create a new process in a workspace
 */
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(params.workspaceId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    const body = await req.json();
    const data = createProcessSchema.parse(body);

    const process = await db.process.create({
      data: {
        workspaceId: params.workspaceId,
        name: data.name,
        description: data.description || '',
        owner: data.owner,
      },
      include: {
        _count: {
          select: {
            steps: true,
          },
        },
      },
    });

    return ok({ process });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create process', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to create process');
  }
}
