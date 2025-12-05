import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';

/**
 * GET /api/sessions/[sessionId]/messages
 *
 * Retrieve chat message history for a session
 * M14: Added for persistent chat history
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const { sessionId } = params;

    // Verify session exists and user has access
    const assistantSession = await db.assistantSession.findUnique({
      where: { id: sessionId },
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

    if (!assistantSession || assistantSession.workspace.members.length === 0) {
      return CommonErrors.notFound('Session');
    }

    // Fetch messages ordered by creation time
    const messages = await db.sessionMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return ok({ messages });
  } catch (error: any) {
    console.error('Fetch messages error:', error);
    return CommonErrors.internalError('Failed to fetch messages');
  }
}
