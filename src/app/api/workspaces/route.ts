import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

export async function GET() {
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const workspaces = await db.workspace.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    return ok({ workspaces });
  } catch (error) {
    logError('Get workspaces', error, { userId: session?.user?.id });
    return CommonErrors.internalError('Failed to load workspaces');
  }
}
