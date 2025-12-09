import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, CommonErrors } from "@/lib/api-response";
import { logError } from "@/lib/logging";
import { z } from "zod";

const updateOpportunitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  opportunityType: z.string().optional(),
  impactLevel: z.enum(['low', 'medium', 'high']).optional(),
  effortLevel: z.enum(['low', 'medium', 'high']).optional(),
  impactScore: z.number().min(0).max(100).optional(),
  feasibilityScore: z.number().min(0).max(100).optional(),
  rationaleText: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { opportunityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const opportunity = await db.opportunity.findFirst({
      where: {
        id: params.opportunityId,
        process: {
          workspace: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      },
      include: {
        process: {
          select: {
            id: true,
            name: true,
          },
        },
        step: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!opportunity) {
      return CommonErrors.notFound("Opportunity");
    }

    return ok({ opportunity });
  } catch (error) {
    logError("Get opportunity", error, { opportunityId: params.opportunityId });
    return CommonErrors.internalError("Failed to fetch opportunity");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { opportunityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    // Verify access
    const existingOpportunity = await db.opportunity.findFirst({
      where: {
        id: params.opportunityId,
        process: {
          workspace: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!existingOpportunity) {
      return CommonErrors.notFound("Opportunity");
    }

    const body = await req.json();
    const data = updateOpportunitySchema.parse(body);

    const opportunity = await db.opportunity.update({
      where: { id: params.opportunityId },
      data,
      include: {
        process: {
          select: {
            id: true,
            name: true,
          },
        },
        step: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return ok({ opportunity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError("Update opportunity", error, { opportunityId: params.opportunityId });
    return CommonErrors.internalError("Failed to update opportunity");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { opportunityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    // Verify access
    const existingOpportunity = await db.opportunity.findFirst({
      where: {
        id: params.opportunityId,
        process: {
          workspace: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!existingOpportunity) {
      return CommonErrors.notFound("Opportunity");
    }

    await db.opportunity.delete({
      where: { id: params.opportunityId },
    });

    return ok({ success: true });
  } catch (error) {
    logError("Delete opportunity", error, { opportunityId: params.opportunityId });
    return CommonErrors.internalError("Failed to delete opportunity");
  }
}
