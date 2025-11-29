import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateProcessSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeGraph = searchParams.get('includeGraph') === 'true';

    const process = await db.process.findUnique({
      where: { id: params.processId },
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
        ...(includeGraph && {
          steps: {
            orderBy: { createdAt: 'asc' },
          },
          links: {
            orderBy: { createdAt: 'asc' },
          },
        }),
      },
    });

    if (!process || process.project.workspace.members.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ process });
  } catch (error) {
    console.error('Get process error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access
    const existingProcess = await db.process.findUnique({
      where: { id: params.processId },
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

    if (
      !existingProcess ||
      existingProcess.project.workspace.members.length === 0
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = updateProcessSchema.parse(body);

    const process = await db.process.update({
      where: { id: params.processId },
      data,
    });

    return NextResponse.json({ process });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Update process error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
