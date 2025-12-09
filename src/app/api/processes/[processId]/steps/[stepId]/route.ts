import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateStepSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

async function verifyStepAccess(stepId: string, userId: string) {
  const step = await db.processStep.findUnique({
    where: { id: stepId },
    include: {
      process: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  });

  return step && step.process.workspace.members.length > 0;
}

export async function GET(
  req: Request,
  { params }: { params: { processId: string; stepId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const step = await db.processStep.findUnique({
      where: { id: params.stepId },
      include: {
        process: {
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

    if (!step || step.process.workspace.members.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Return step without full process details to reduce payload
    const { process, ...stepData } = step;

    return NextResponse.json({
      ok: true,
      data: { step: stepData }
    });
  } catch (error) {
    console.error('Get step error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { processId: string; stepId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await verifyStepAccess(params.stepId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = updateStepSchema.parse(body);

    const step = await db.processStep.update({
      where: { id: params.stepId },
      data,
    });

    return NextResponse.json({ step });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Update step error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { processId: string; stepId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await verifyStepAccess(params.stepId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.processStep.delete({
      where: { id: params.stepId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete step error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
