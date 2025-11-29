import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { scanProcess } from '@/lib/opportunity-scanner';

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

    // Run the scan
    const opportunities = await scanProcess(processId);

    return NextResponse.json({
      success: true,
      count: opportunities.length,
      opportunities,
    });
  } catch (error: any) {
    console.error('Error scanning process for opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to scan process', details: error.message },
      { status: 500 }
    );
  }
}
