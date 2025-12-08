import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

/**
 * GET /api/ai-use-cases/[aiUseCaseId]
 * Fetch full AI use case details
 */
export async function GET(
  req: Request,
  { params }: { params: { aiUseCaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Fetch AI use case with access check
    const aiUseCase = await db.aiUseCase.findFirst({
      where: {
        id: params.aiUseCaseId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        blueprint: {
          select: {
            id: true,
            title: true,
            version: true,
            createdAt: true,
          },
        },
        riskAssessment: {
          select: {
            id: true,
            riskLevel: true,
            summaryText: true,
          },
        },
      },
    });

    if (!aiUseCase) {
      return CommonErrors.notFound('AI use case');
    }

    // Format metadata
    const metadata = aiUseCase.metadataJson as any || {};
    const linkedProcessIds = aiUseCase.linkedProcessIds as any || [];
    const linkedOpportunityIds = aiUseCase.linkedOpportunityIds as any || [];
    const linkedToolIds = aiUseCase.linkedToolIds as any || [];

    const formattedUseCase = {
      id: aiUseCase.id,
      workspaceId: aiUseCase.workspaceId,
      title: aiUseCase.title,
      description: aiUseCase.description,
      status: aiUseCase.status,
      owner: aiUseCase.owner,
      source: aiUseCase.source,
      createdAt: aiUseCase.createdAt,
      updatedAt: aiUseCase.updatedAt,
      linkedProcessIds,
      linkedOpportunityIds,
      linkedToolIds,
      riskAssessment: aiUseCase.riskAssessment || null,
      metadata: {
        processCount: metadata.processCount || linkedProcessIds.length || 0,
        opportunityCount: metadata.opportunityCount || linkedOpportunityIds.length || 0,
        toolCount: metadata.toolCount || linkedToolIds.length || 0,
      },
    };

    return ok({
      aiUseCase: formattedUseCase,
      blueprint: aiUseCase.blueprint || null,
    });
  } catch (error) {
    logError('Get AI use case', error, { aiUseCaseId: params.aiUseCaseId });
    return CommonErrors.internalError('Failed to load AI use case');
  }
}
