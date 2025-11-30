import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { verifyWorkspaceAccess } from '@/lib/access-control';

/**
 * GET /api/workspaces/[workspaceId]/policies
 * List all active policies for a workspace
 */
export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(params.workspaceId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    // Fetch all active policies
    const policies = await db.aiPolicy.findMany({
      where: {
        workspaceId: params.workspaceId,
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return ok({ policies });
  } catch (error) {
    logError('List workspace policies', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to load policies');
  }
}

const createPolicySchema = z.object({
  key: z.string().min(1).regex(/^[A-Z0-9_]+$/, 'Key must be uppercase letters, numbers, and underscores'),
  name: z.string().min(1),
  category: z.enum(['privacy', 'security', 'ethics', 'governance']),
  description: z.string().min(1),
});

/**
 * POST /api/workspaces/[workspaceId]/policies
 * Create a new policy in the workspace library
 */
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(params.workspaceId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    const body = await req.json();
    const data = createPolicySchema.parse(body);

    // Check for duplicate key
    const existing = await db.aiPolicy.findUnique({
      where: {
        workspaceId_key: {
          workspaceId: params.workspaceId,
          key: data.key,
        },
      },
    });

    if (existing) {
      return CommonErrors.invalidInput('A policy with this key already exists');
    }

    // Create policy
    const policy = await db.aiPolicy.create({
      data: {
        workspaceId: params.workspaceId,
        key: data.key,
        name: data.name,
        category: data.category,
        description: data.description,
        isActive: true,
      },
    });

    return ok({ policy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create workspace policy', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to create policy');
  }
}
