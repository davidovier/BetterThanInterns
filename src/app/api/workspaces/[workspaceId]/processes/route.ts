import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { verifyWorkspaceAccess } from '@/lib/access-control';

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

    // Fetch all processes for this workspace (via projects)
    const processes = await db.process.findMany({
      where: {
        project: {
          workspaceId: params.workspaceId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
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
      projectId: process.projectId,
      projectName: process.project.name,
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
