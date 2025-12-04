import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, CommonErrors } from "@/lib/api-response";
import { logError } from "@/lib/logging";

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
          project: {
            workspace: {
              members: {
                some: {
                  userId: session.user.id,
                },
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
