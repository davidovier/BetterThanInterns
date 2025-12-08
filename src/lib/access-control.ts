import { db } from './db';

/**
 * Performance-optimized access control helpers
 * These use minimal database queries to verify user permissions
 */

export async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const member = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    select: { id: true },
  });

  return !!member;
}

export async function verifyProjectAccess(
  projectId: string,
  userId: string
): Promise<boolean> {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    select: { id: true },
  });

  return !!project;
}

export async function verifyProcessAccess(
  processId: string,
  userId: string
): Promise<boolean> {
  const process = await db.process.findFirst({
    where: {
      id: processId,
      workspace: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    select: { id: true },
  });

  return !!process;
}

export async function verifyOpportunityAccess(
  opportunityId: string,
  userId: string
): Promise<boolean> {
  const opportunity = await db.opportunity.findFirst({
    where: {
      id: opportunityId,
      process: {
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
    select: { id: true },
  });

  return !!opportunity;
}

export async function verifyBlueprintAccess(
  blueprintId: string,
  userId: string
): Promise<boolean> {
  const blueprint = await db.blueprint.findFirst({
    where: {
      id: blueprintId,
      workspace: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    select: { id: true },
  });

  return !!blueprint;
}
