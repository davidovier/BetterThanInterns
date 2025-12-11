import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

const reorderSchema = z.object({
  stepIds: z.array(z.string()).min(1, 'Must provide at least one step'),
});

async function verifyProcessAccess(processId: string, userId: string) {
  const process = await db.process.findUnique({
    where: { id: processId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  return process && process.workspace.members.length > 0;
}

/**
 * POST /api/processes/[processId]/steps/reorder
 * Reorder steps and update their positions + links to maintain sequential flow
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const hasAccess = await verifyProcessAccess(params.processId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this process');
    }

    const body = await req.json();
    const { stepIds } = reorderSchema.parse(body);

    // Verify all steps belong to this process
    const steps = await db.processStep.findMany({
      where: {
        id: { in: stepIds },
        processId: params.processId,
      },
    });

    if (steps.length !== stepIds.length) {
      return CommonErrors.invalidInput('Some steps do not belong to this process');
    }

    // Update positions in a transaction
    await db.$transaction(async (tx) => {
      // Update step positions (vertical layout)
      for (let i = 0; i < stepIds.length; i++) {
        await tx.processStep.update({
          where: { id: stepIds[i] },
          data: {
            positionX: 300, // Center X position
            positionY: i * 150, // Vertical spacing
          },
        });
      }

      // Delete all existing links for this process
      await tx.processLink.deleteMany({
        where: { processId: params.processId },
      });

      // Create new sequential links
      for (let i = 0; i < stepIds.length - 1; i++) {
        await tx.processLink.create({
          data: {
            processId: params.processId,
            fromStepId: stepIds[i],
            toStepId: stepIds[i + 1],
            label: null,
          },
        });
      }
    });

    // Fetch updated process data
    const process = await db.process.findUnique({
      where: { id: params.processId },
      include: {
        steps: { orderBy: { positionY: 'asc' } },
        links: true,
      },
    });

    return ok({ process });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Reorder steps', error, { processId: params.processId });
    return CommonErrors.internalError('Failed to reorder steps');
  }
}
