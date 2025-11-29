import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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

    const chatSession = await db.chatSession.create({
      data: {
        processId: params.processId,
      },
    });

    return NextResponse.json({ chatSession });
  } catch (error) {
    console.error('Create chat session error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
