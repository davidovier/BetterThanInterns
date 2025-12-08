/**
 * Data Migration: Populate workspaceId for existing processes and blueprints
 *
 * This script migrates existing data from project-scoped to workspace-scoped by:
 * 1. Finding all processes and copying project.workspaceId to process.workspaceId
 * 2. Finding all blueprints and copying project.workspaceId to blueprint.workspaceId
 * 3. Finding all AI use cases and copying project.workspaceId (if needed)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting data migration to workspace-scoped entities...\n');

  // Step 1: Migrate Processes using raw SQL
  console.log('📊 Migrating processes...');

  // Add workspaceId column if it doesn't exist
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "processes"
    ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
  `);

  // Populate workspaceId from project relationship
  const processResult = await prisma.$executeRawUnsafe(`
    UPDATE "processes" p
    SET "workspaceId" = pr."workspaceId"
    FROM "projects" pr
    WHERE p."projectId" = pr."id"
      AND p."workspaceId" IS NULL;
  `);

  console.log(`✅ Migrated ${processResult} processes\n`);

  // Step 2: Migrate Blueprints using raw SQL
  console.log('📋 Migrating blueprints...');

  // Add workspaceId column if it doesn't exist
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "blueprints"
    ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
  `);

  // Populate workspaceId from project relationship
  const blueprintResult = await prisma.$executeRawUnsafe(`
    UPDATE "blueprints" b
    SET "workspaceId" = pr."workspaceId"
    FROM "projects" pr
    WHERE b."projectId" = pr."id"
      AND b."workspaceId" IS NULL;
  `);

  console.log(`✅ Migrated ${blueprintResult} blueprints\n`);

  // Step 3: Verify the migration
  console.log('🔍 Verifying migration...');
  const processCount = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*) as count FROM "processes" WHERE "workspaceId" IS NOT NULL;
  `);
  const blueprintCount = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*) as count FROM "blueprints" WHERE "workspaceId" IS NOT NULL;
  `);

  console.log(`  Processes with workspaceId: ${processCount[0]?.count || 0}`);
  console.log(`  Blueprints with workspaceId: ${blueprintCount[0]?.count || 0}\n`);

  // Step 4: Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Migration Summary:');
  console.log(`   Processes migrated: ${processResult}`);
  console.log(`   Blueprints migrated: ${blueprintResult}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Data migration completed successfully!');
  console.log('\n📝 Next step: Run `DATABASE_URL="$DIRECT_URL" npx prisma db push` to apply schema changes');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
