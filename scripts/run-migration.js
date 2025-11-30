const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const sql = fs.readFileSync('/tmp/g2_migration.sql', 'utf8');

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error('DIRECT_URL not found in environment');
  process.exit(1);
}

console.log('Executing G2 migration SQL...');

try {
  const command = `psql "${directUrl}" -c "${sql.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  console.log(output);
  console.log('✓ Migration completed successfully');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
