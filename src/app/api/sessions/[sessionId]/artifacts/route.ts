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
    const [processes, opportunities, blueprints, aiUseCases] = await Promise.all([
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

      // Load blueprints
      metadata.blueprintIds?.length > 0
        ? db.blueprint.findMany({
            where: {
              id: { in: metadata.blueprintIds },
              workspaceId: assistantSession.workspaceId,
            },
            select: {
              id: true,
              title: true,
              createdAt: true,
              updatedAt: true,
              version: true,
              // Don't load full markdown/json content for list view
            },
          })
        : Promise.resolve([]),

      // Load AI use cases
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
              status: true,
              owner: true,
              linkedProcessIds: true,
              linkedOpportunityIds: true,
            },
          })
        : Promise.resolve([]),
    ]);

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
