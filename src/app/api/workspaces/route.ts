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
      select: {
        id: true,
        name: true,
        plan: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: {
            userId: session.user.id,
          },
          select: {
            role: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Transform to include userRole at top level
    const workspacesWithRole = workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      plan: ws.plan,
      trialEndsAt: ws.trialEndsAt,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt,
      userRole: ws.members[0]?.role || 'member',
    }));

    return ok({ workspaces: workspacesWithRole });
  } catch (error) {
    logError('Get workspaces', error, { userId: session?.user?.id });
    return CommonErrors.internalError('Failed to load workspaces');
  }
}
