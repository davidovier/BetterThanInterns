import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { z } from 'zod';

const updateBlueprintSchema = z.object({
  title: z.string().min(1).optional(),
  contentJson: z.any().optional(),
  renderedMarkdown: z.string().optional(),
  metadataJson: z.any().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { blueprintId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return CommonErrors.unauthorized();
    }

    const { blueprintId } = params;

    // Fetch blueprint with workspace to verify access
    const blueprint = await db.blueprint.findUnique({
      where: { id: blueprintId },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                user: { email: session.user.email },
              },
            },
          },
        },
      },
    });

    if (!blueprint || blueprint.workspace.members.length === 0) {
      return CommonErrors.notFound('Blueprint', 'Blueprint not found or access denied');
    }

    return ok({
      blueprint: {
        id: blueprint.id,
        workspaceId: blueprint.workspaceId,
        title: blueprint.title,
        contentJson: blueprint.contentJson,
        renderedMarkdown: blueprint.renderedMarkdown,
        version: blueprint.version,
        metadataJson: blueprint.metadataJson,
        createdAt: blueprint.createdAt,
        updatedAt: blueprint.updatedAt,
      },
    });
  } catch (error) {
    logError('Fetch blueprint', error, { blueprintId: params.blueprintId });
    return CommonErrors.internalError('Failed to fetch blueprint');
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { blueprintId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return CommonErrors.unauthorized();
    }

    // Verify access
    const existingBlueprint = await db.blueprint.findUnique({
      where: { id: params.blueprintId },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                user: { email: session.user.email },
              },
            },
          },
        },
      },
    });

    if (!existingBlueprint || existingBlueprint.workspace.members.length === 0) {
      return CommonErrors.notFound('Blueprint');
    }

    const body = await req.json();
    const data = updateBlueprintSchema.parse(body);

    const blueprint = await db.blueprint.update({
      where: { id: params.blueprintId },
      data,
    });

    return ok({ blueprint });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Update blueprint', error, { blueprintId: params.blueprintId });
    return CommonErrors.internalError('Failed to update blueprint');
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { blueprintId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return CommonErrors.unauthorized();
    }

    // Verify access
    const existingBlueprint = await db.blueprint.findUnique({
      where: { id: params.blueprintId },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                user: { email: session.user.email },
              },
            },
          },
        },
      },
    });

    if (!existingBlueprint || existingBlueprint.workspace.members.length === 0) {
      return CommonErrors.notFound('Blueprint');
    }

    await db.blueprint.delete({
      where: { id: params.blueprintId },
    });

    return ok({ success: true });
  } catch (error) {
    logError('Delete blueprint', error, { blueprintId: params.blueprintId });
    return CommonErrors.internalError('Failed to delete blueprint');
  }
}
