import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createProcessSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  owner: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to project
    const project = await db.project.findUnique({
      where: { id: params.projectId },
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

    if (!project || project.workspace.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const processes = await db.process.findMany({
      where: { projectId: params.projectId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ processes });
  } catch (error) {
    console.error('Get processes error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to project
    const project = await db.project.findUnique({
      where: { id: params.projectId },
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

    if (!project || project.workspace.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = createProcessSchema.parse(body);

    const process = await db.process.create({
      data: {
        ...data,
        projectId: params.projectId,
      },
    });

    return NextResponse.json({ process });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Create process error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
