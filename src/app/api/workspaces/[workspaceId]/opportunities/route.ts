import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { verifyWorkspaceAccess } from '@/lib/access-control';

/**
 * GET /api/workspaces/[workspaceId]/opportunities
 * List all automation opportunities in a workspace (across all processes)
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

    // Parse query params for filtering
    const { searchParams } = new URL(req.url);
    const impactLevel = searchParams.get('impactLevel');

    // Build where clause
    const where: any = {
      process: {
        workspaceId: params.workspaceId,
      },
    };

    if (impactLevel) {
      where.impactLevel = impactLevel;
    }

    // Fetch all opportunities for this workspace (via processes -> projects)
    const opportunities = await db.opportunity.findMany({
      where,
      include: {
        process: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        impactScore: 'desc',
      },
    });

    // Format response
    const formattedOpportunities = opportunities.map((opp) => ({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      opportunityType: opp.opportunityType,
      impactLevel: opp.impactLevel,
      effortLevel: opp.effortLevel,
      impactScore: opp.impactScore,
      feasibilityScore: opp.feasibilityScore,
      processId: opp.processId,
      processName: opp.process.name,
      createdAt: opp.createdAt,
      updatedAt: opp.updatedAt,
    }));

    return ok({ opportunities: formattedOpportunities });
  } catch (error) {
    logError('List opportunities', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to load opportunities');
  }
}
