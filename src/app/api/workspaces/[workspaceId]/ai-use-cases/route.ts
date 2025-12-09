import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { verifyWorkspaceAccess } from '@/lib/access-control';
import { z } from 'zod';

const createAiUseCaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  status: z.enum(['planned', 'pilot', 'production', 'paused']).default('planned'),
  owner: z.string().optional(),
  source: z.enum(['manual', 'blueprint']).default('manual'),
  blueprintId: z.string().optional(),
  linkedProcessIds: z.any().optional(),
  linkedOpportunityIds: z.any().optional(),
  linkedToolIds: z.any().optional(),
  metadataJson: z.any().optional(),
});

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
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      workspaceId: params.workspaceId,
    };

    if (status) {
      where.status = status;
    }

    // Fetch AI use cases
    const aiUseCases = await db.aiUseCase.findMany({
      where,
      include: {
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

/**
 * POST /api/workspaces/[workspaceId]/ai-use-cases
 * Create a new AI use case in a workspace
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
    const data = createAiUseCaseSchema.parse(body);

    const aiUseCase = await db.aiUseCase.create({
      data: {
        workspaceId: params.workspaceId,
        title: data.title,
        description: data.description,
        status: data.status,
        owner: data.owner,
        source: data.source,
        blueprintId: data.blueprintId,
        linkedProcessIds: data.linkedProcessIds || [],
        linkedOpportunityIds: data.linkedOpportunityIds || [],
        linkedToolIds: data.linkedToolIds || [],
        metadataJson: data.metadataJson || {},
      },
    });

    return ok({ aiUseCase });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create AI use case', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to create AI use case');
  }
}
