import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createLinkSchema = z.object({
  fromStepId: z.string(),
  toStepId: z.string(),
  label: z.string().optional(),
  linkType: z.string().optional(),
});

async function verifyProcessAccess(processId: string, userId: string) {
  const process = await db.process.findUnique({
    where: { id: processId },
    include: {
      project: {
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

  return process && process.project.workspace.members.length > 0;
}

export async function POST(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await verifyProcessAccess(
      params.processId,
      session.user.id
    );
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = createLinkSchema.parse(body);

    const link = await db.processLink.create({
      data: {
        processId: params.processId,
        fromStepId: data.fromStepId,
        toStepId: data.toStepId,
        label: data.label,
        linkType: data.linkType || 'flow',
      },
    });

    return NextResponse.json({ link });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Create link error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
