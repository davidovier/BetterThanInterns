import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  matchToolsForOpportunity,
  getToolRecommendations,
} from '@/lib/tool-matcher';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Check workspace access
    if (opportunity.process.project.workspace.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if we already have recommendations
    let recommendations = await getToolRecommendations(opportunityId);

    // If no recommendations exist, generate them
    if (recommendations.length === 0) {
      console.log(`Generating tool recommendations for opportunity ${opportunityId}`);
      recommendations = await matchToolsForOpportunity(opportunityId);
    }

    return NextResponse.json({ tools: recommendations });
  } catch (error: any) {
    console.error('Error fetching tool recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations', details: error.message },
      { status: 500 }
    );
  }
}
