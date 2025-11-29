import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateToolSelection } from '@/lib/tool-matcher';

/**
 * PATCH /api/opportunities/[opportunityId]/tools/[toolId]
 *
 * Update tool selection status for blueprint inclusion.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { opportunityId: string; toolId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { opportunityId, toolId } = params;
    const body = await req.json();
    const { userSelected } = body;

    if (typeof userSelected !== 'boolean') {
      return NextResponse.json(
        { error: 'userSelected must be a boolean' },
        { status: 400 }
      );
    }

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

    // Update the selection
    await updateToolSelection(opportunityId, toolId, userSelected);

    return NextResponse.json({
      success: true,
      userSelected,
    });
  } catch (error: any) {
    console.error('Error updating tool selection:', error);
    return NextResponse.json(
      { error: 'Failed to update selection', details: error.message },
      { status: 500 }
    );
  }
}
