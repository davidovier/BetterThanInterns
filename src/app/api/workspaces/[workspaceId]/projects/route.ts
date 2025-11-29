import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  clientName: z.string().optional(),
  industry: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify user has access to workspace
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    const projects = await db.project.findMany({
      where: {
        workspaceId: params.workspaceId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return ok({ projects });
  } catch (error) {
    logError('Get projects', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to load projects');
  }
}

export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify user has access to workspace
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    const body = await req.json();
    const data = createProjectSchema.parse(body);

    const project = await db.project.create({
      data: {
        ...data,
        workspaceId: params.workspaceId,
      },
    });

    return ok({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create project', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to create project');
  }
}
