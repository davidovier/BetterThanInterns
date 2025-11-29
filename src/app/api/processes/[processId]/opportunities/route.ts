import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getProcessOpportunities } from '@/lib/opportunity-scanner';

/**
 * GET /api/processes/[processId]/opportunities
 *
 * Returns all saved opportunities for a process, sorted by impact score.
 */
export async function GET(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    // Check workspace access
    if (process.project.workspace.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get opportunities
    const opportunities = await getProcessOpportunities(processId);

    return NextResponse.json({ opportunities });
  } catch (error: any) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: error.message },
      { status: 500 }
    );
  }
}
