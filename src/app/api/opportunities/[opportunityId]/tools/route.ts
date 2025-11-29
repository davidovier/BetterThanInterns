import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  matchToolsForOpportunity,
  getToolRecommendations,
} from '@/lib/tool-matcher';
import { ok, CommonErrors, ErrorCodes, error } from '@/lib/api-response';
import { logError } from '@/lib/logging';

/**
 * GET /api/opportunities/[opportunityId]/tools
 *
 * Returns recommended tools for an opportunity.
 * If recommendations don't exist yet, generates them.
 */
export async function GET(
  req: Request,
  { params }: { params: { opportunityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const opportunityId = params.opportunityId;

    // Verify the opportunity exists and user has access
    const opportunity = await db.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        process: {
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
        },
      },
    });

    if (!opportunity) {
      return CommonErrors.notFound('Opportunity');
    }

    // Check workspace access
    if (opportunity.process.project.workspace.members.length === 0) {
      return CommonErrors.forbidden('You do not have access to this opportunity');
    }

    // Check if we already have recommendations
    let recommendations = await getToolRecommendations(opportunityId);

    // If no recommendations exist, generate them
    if (recommendations.length === 0) {
      console.log(`Generating tool recommendations for opportunity ${opportunityId}`);
      recommendations = await matchToolsForOpportunity(opportunityId);
    }

    return ok({ tools: recommendations });
  } catch (err: any) {
    logError('Tool recommendations', err, { opportunityId: params.opportunityId });

    // Check if it's an LLM-specific error
    if (err instanceof Error && err.message.includes('LLM')) {
      return error(
        500,
        ErrorCodes.TOOL_MATCH_FAILED,
        'Failed to generate tool recommendations. The AI service encountered an error. Please try again.'
      );
    }

    return CommonErrors.internalError('Failed to fetch tool recommendations');
  }
}
