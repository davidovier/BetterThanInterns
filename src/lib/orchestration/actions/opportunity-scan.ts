/**
 * Opportunity Scanning Action Handler
 *
 * Scans a process for automation opportunities using existing scanner logic.
 */

import { scanProcess } from '@/lib/opportunity-scanner';
import { ScanOpportunitiesParams } from '../types';

export async function scanOpportunities(
  params: ScanOpportunitiesParams
): Promise<string[]> {
  try {
    // Use existing opportunity scanner
    const opportunities = await scanProcess(params.processId);

    // Return array of opportunity IDs
    return opportunities.map((opp) => opp.id);
  } catch (error) {
    console.error('Error scanning opportunities:', error);
    throw new Error('Failed to scan opportunities');
  }
}
