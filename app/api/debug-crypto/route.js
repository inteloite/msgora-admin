import { NextResponse } from 'next/server';
import { generateKey, validateKey, planToExpiry } from '@/lib/license';

// Temporary debug endpoint - tests crypto roundtrip on the live server
// DELETE this file after debugging is done
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const rawMid = searchParams.get('machineId') || '7D083054170571EB';
    const cleanMid = rawMid.trim().toUpperCase().replace(/[-\s]/g, '');

    const expiryTs = planToExpiry('monthly');
    const key = generateKey({ machineId: cleanMid, expiryTs, deviceLimit: 1 });
    const result = validateKey(key, cleanMid);

    return NextResponse.json({
        input: rawMid,
        cleanMid,
        generatedKey: key,
        roundtripValid: result !== null && result.valid,
        secret_last4: (process.env.LICENSE_SECRET || 'NOT_SET').slice(-4),
        secretSource: process.env.LICENSE_SECRET ? 'env' : 'hardcoded_fallback',
    });
}
