/**
 * M24 - Workspace Usage API
 *
 * GET /api/workspaces/[workspaceId]/usage
 *   Returns ICU usage summary for workspace
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, CommonErrors } from '@/lib/api-response';
import { db } from '@/lib/db';
import { getWorkspaceUsage } from '@/lib/icuAccounting';

/**
 * GET /api/workspaces/[workspaceId]/usage
 *
 * Returns ICU usage summary for frontend display
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const { workspaceId } = params;

    // Verify user has access to this workspace
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!workspace || workspace.members.length === 0) {
      return CommonErrors.notFound('Workspace');
    }

    // Get comprehensive usage summary
    const usage = await getWorkspaceUsage(workspaceId);

    return ok(usage);
  } catch (error) {
    console.error('Error fetching workspace usage:', error);
    return CommonErrors.internalError();
  }
}
