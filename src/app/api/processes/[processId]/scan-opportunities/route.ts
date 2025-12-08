import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { scanProcess } from '@/lib/opportunity-scanner';
import { ok, CommonErrors, ErrorCodes, error } from '@/lib/api-response';
import { logError } from '@/lib/logging';

/**
 * POST /api/processes/[processId]/scan-opportunities
 *
 * Analyzes all steps in a process for AI/automation opportunities.
 * Uses LLM to evaluate each step and stores results in the database.
 */
export async function POST(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const processId = params.processId;

    // Verify the process exists and user has access
    const process = await db.process.findUnique({
      where: { id: processId },
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

    if (!process) {
      return CommonErrors.notFound('Process');
    }

    // Check workspace access
    if (process.project.workspace.members.length === 0) {
      return CommonErrors.forbidden('You do not have access to this process');
    }

    // Run the scan
    const opportunities = await scanProcess(processId);

    // Extract opportunityIds
    const opportunityIds = opportunities.map(opp => opp.id);

    // If sessionId is provided in query, update session metadata
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');

    if (sessionId) {
      // Verify session exists and user has access
      const assistantSession = await db.assistantSession.findFirst({
        where: {
          id: sessionId,
          workspace: {
            members: {
              some: { userId: session.user.id },
            },
          },
        },
      });

      if (assistantSession) {
        // Update session metadata with opportunity IDs
        const currentMetadata = (assistantSession.metadata as any) || {};
        const updatedOpportunityIds = [
          ...(currentMetadata.opportunityIds || []),
          ...opportunityIds,
        ];

        await db.assistantSession.update({
          where: { id: sessionId },
          data: {
            metadata: {
              ...currentMetadata,
              opportunityIds: updatedOpportunityIds,
            },
          },
        });
      }
    }

    return ok({
      count: opportunities.length,
      opportunities,
      opportunityIds, // Return IDs for client-side metadata updates
    });
  } catch (err: any) {
    logError('Opportunity scan', err, { processId: params.processId });

    // Check if it's an LLM-specific error
    if (err instanceof Error && err.message.includes('LLM')) {
      return error(
        500,
        ErrorCodes.OPPORTUNITY_SCAN_FAILED,
        'Failed to scan for opportunities. The AI service encountered an error. Please try again.'
      );
    }

    return CommonErrors.internalError('Failed to scan process for opportunities');
  }
}
