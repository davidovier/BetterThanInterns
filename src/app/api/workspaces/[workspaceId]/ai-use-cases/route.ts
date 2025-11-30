import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { verifyWorkspaceAccess } from '@/lib/access-control';

/**
 * GET /api/workspaces/[workspaceId]/ai-use-cases
 * List all AI use cases in a workspace
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

    // Parse query params
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      workspaceId: params.workspaceId,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    // Fetch AI use cases
    const aiUseCases = await db.aiUseCase.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        blueprint: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response with metadata
    const formattedUseCases = aiUseCases.map((uc) => {
      const metadata = uc.metadataJson as any || {};
      const linkedProcessIds = uc.linkedProcessIds as any || [];
      const linkedOpportunityIds = uc.linkedOpportunityIds as any || [];
      const linkedToolIds = uc.linkedToolIds as any || [];

      return {
        id: uc.id,
        title: uc.title,
        description: uc.description,
        status: uc.status,
        owner: uc.owner,
        source: uc.source,
        projectId: uc.projectId,
        projectName: uc.project.name,
        blueprintId: uc.blueprintId,
        blueprintTitle: uc.blueprint?.title,
        createdAt: uc.createdAt,
        updatedAt: uc.updatedAt,
        metadata: {
          processCount: metadata.processCount || linkedProcessIds.length || 0,
          opportunityCount: metadata.opportunityCount || linkedOpportunityIds.length || 0,
          toolCount: metadata.toolCount || linkedToolIds.length || 0,
        },
      };
    });

    return ok({ aiUseCases: formattedUseCases });
  } catch (error) {
    logError('List AI use cases', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to load AI use cases');
  }
}
