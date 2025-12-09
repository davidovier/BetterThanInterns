import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getProcessOpportunities } from '@/lib/opportunity-scanner';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

const createOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  stepId: z.string().optional(),
  opportunityType: z.string(),
  impactLevel: z.enum(['low', 'medium', 'high']),
  effortLevel: z.enum(['low', 'medium', 'high']),
  impactScore: z.number().min(0).max(100),
  feasibilityScore: z.number().min(0).max(100),
  rationaleText: z.string(),
});

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
        workspace: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    // Check workspace access
    if (process.workspace.members.length === 0) {
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

/**
 * POST /api/processes/[processId]/opportunities
 * Create a new opportunity for a process
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

    // Verify the process exists and user has access
    const process = await db.process.findUnique({
      where: { id: params.processId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!process) {
      return CommonErrors.notFound('Process');
    }

    if (process.workspace.members.length === 0) {
      return CommonErrors.forbidden('You do not have access to this process');
    }

    const body = await req.json();
    const data = createOpportunitySchema.parse(body);

    const opportunity = await db.opportunity.create({
      data: {
        processId: params.processId,
        stepId: data.stepId,
        title: data.title,
        description: data.description,
        opportunityType: data.opportunityType,
        impactLevel: data.impactLevel,
        effortLevel: data.effortLevel,
        impactScore: data.impactScore,
        feasibilityScore: data.feasibilityScore,
        rationaleText: data.rationaleText,
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
    });

    return ok({ opportunity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create opportunity', error, { processId: params.processId });
    return CommonErrors.internalError('Failed to create opportunity');
  }
}
