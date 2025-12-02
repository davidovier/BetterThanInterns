import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors, ErrorCodes, error } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { z } from 'zod';
import { compare } from 'bcrypt';

/**
 * GET /api/account/profile
 *
 * Returns the current authenticated user's profile information
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        workspaces: {
          select: {
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return CommonErrors.notFound('User');
    }

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        workspaceCount: user.workspaces.length,
      },
    });
  } catch (err) {
    logError('Failed to fetch user profile', err);
    return CommonErrors.internalError();
  }
}

/**
 * PATCH /api/account/profile
 *
 * Update user profile (name, email)
 * Email changes require current password for security
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const body = await request.json();

    // Validate input
    const schema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      currentPassword: z.string().optional(),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return CommonErrors.invalidInput(
        validation.error.errors.map((e) => e.message).join(', ')
      );
    }

    const { name, email, currentPassword } = validation.data;

    // If changing email, require password verification
    if (email) {
      if (!currentPassword) {
        return CommonErrors.invalidInput(
          'Current password is required when changing email'
        );
      }

      // Verify current password
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) {
        return CommonErrors.notFound('User');
      }

      const isPasswordValid = await compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return error(
          401,
          ErrorCodes.UNAUTHORIZED,
          'Current password is incorrect'
        );
      }

      // Check if email is already in use
      const normalizedEmail = email.toLowerCase();
      const existingUser = await db.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return error(
          400,
          ErrorCodes.ALREADY_EXISTS,
          'This email is already in use'
        );
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email && { email: email.toLowerCase() }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    logError('Failed to update user profile', err);
    return CommonErrors.internalError();
  }
}
