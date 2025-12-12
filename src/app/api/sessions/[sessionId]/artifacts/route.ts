import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

/**
 * GET /api/sessions/[sessionId]/artifacts
 * Bulk load all artifacts for a session in a single optimized request
 * This significantly improves performance compared to loading each artifact individually
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Get session and verify access
    const assistantSession = await db.assistantSession.findFirst({
      where: {
        id: params.sessionId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      select: {
        id: true,
        metadata: true,
        workspaceId: true,
      },
    });

    if (!assistantSession) {
      return CommonErrors.notFound('Session');
    }

    const metadata = assistantSession.metadata as any || {};

    // Use Promise.all to fetch all artifacts in parallel
    const [processes, opportunities, metadataBlueprints, sessionBlueprints, metadataAiUseCases, sessionAiUseCases] = await Promise.all([
      // Load processes with their steps and links
      metadata.processIds?.length > 0
        ? db.process.findMany({
            where: {
              id: { in: metadata.processIds },
              workspaceId: assistantSession.workspaceId,
            },
            include: {
              steps: {
                orderBy: { createdAt: 'asc' },
              },
              links: {
                orderBy: { createdAt: 'asc' },
              },
              _count: {
                select: {
                  steps: true,
                  opportunities: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      // Load opportunities
      metadata.opportunityIds?.length > 0
        ? db.opportunity.findMany({
            where: {
              id: { in: metadata.opportunityIds },
            },
            include: {
              process: {
                select: {
                  id: true,
                  name: true,
                },
              },
              step: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      // Load blueprints from metadata
      metadata.blueprintIds?.length > 0
        ? db.blueprint.findMany({
            where: {
              id: { in: metadata.blueprintIds },
              workspaceId: assistantSession.workspaceId,
            },
            select: {
              id: true,
              title: true,
              summary: true,
              createdAt: true,
              updatedAt: true,
              version: true,
              // Don't load full markdown/json content for list view
            },
          })
        : Promise.resolve([]),

      // Load session-scoped blueprints (M16B)
      db.blueprint.findMany({
        where: {
          sessionId: params.sessionId,
          workspaceId: assistantSession.workspaceId,
        },
        select: {
          id: true,
          title: true,
          summary: true,
          createdAt: true,
          updatedAt: true,
          version: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      // Load AI use cases from metadata
      metadata.aiUseCaseIds?.length > 0
        ? db.aiUseCase.findMany({
            where: {
              id: { in: metadata.aiUseCaseIds },
              workspaceId: assistantSession.workspaceId,
            },
            select: {
              id: true,
              title: true,
              description: true,
              riskSummary: true,
              status: true,
              owner: true,
              linkedProcessIds: true,
              linkedOpportunityIds: true,
            },
          })
        : Promise.resolve([]),

      // Load session-scoped AI use cases (M16B)
      db.aiUseCase.findMany({
        where: {
          sessionId: params.sessionId,
          workspaceId: assistantSession.workspaceId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          riskSummary: true,
          status: true,
          owner: true,
          linkedProcessIds: true,
          linkedOpportunityIds: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // Merge blueprints and AI use cases, removing duplicates
    const blueprintMap = new Map();
    [...metadataBlueprints, ...sessionBlueprints].forEach(b => blueprintMap.set(b.id, b));
    const blueprints = Array.from(blueprintMap.values());

    const aiUseCaseMap = new Map();
    [...metadataAiUseCases, ...sessionAiUseCases].forEach(a => aiUseCaseMap.set(a.id, a));
    const aiUseCases = Array.from(aiUseCaseMap.values());

    return ok({
      processes,
      opportunities,
      blueprints,
      aiUseCases,
    });
  } catch (error) {
    logError('Load session artifacts', error, { sessionId: params.sessionId });
    return CommonErrors.internalError('Failed to load artifacts');
  }
}
