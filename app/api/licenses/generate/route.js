import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { saveLicense, listAllLicenses } from '@/lib/kv';
import { generateKey, planToExpiry } from '@/lib/license';

const LICENSE_LIMIT = 200;

export async function POST(req) {
    const { error, status, session } = await requireAuth(req);
    if (error) return NextResponse.json({ error }, { status });

    // Enforce 200-license limit (trials and weekly excluded)
    const FREE_PLANS = ['trial1day', 'trial', 'weekly'];
    const existing   = await listAllLicenses();
    const body       = await req.json();
    const incomingPlan = body.plan || '';
    if (!FREE_PLANS.includes(incomingPlan)) {
        const quotaCount = existing.filter(l => !FREE_PLANS.includes(l.plan)).length;
        if (quotaCount >= LICENSE_LIMIT)
            return NextResponse.json({ error: `License limit of ${LICENSE_LIMIT} reached. Cannot generate more paid licenses.` }, { status: 403 });
    }

    const {
        clientName, clientPhone, clientEmail, machineId,
        plan, deviceLimit, customDays, notes, price, discountedPrice, features,
        businessCategory, website,
    } = body;

    const DEFAULT_FEATURES = {
        mobile: true, trustBuilder: true, autoReply: true,
        chatbot: true, liveChat: true, groupGrabber: true,
    };

    if (!machineId?.trim() || !plan || !clientName?.trim())
        return NextResponse.json({ error: 'clientName, machineId and plan are required' }, { status: 400 });

    const cleanMachineId = machineId.trim().toUpperCase().replace(/[-\s]/g, '');
    const dl        = Math.max(1, Math.min(255, parseInt(deviceLimit) || 1));
    const expiryTs  = planToExpiry(plan, customDays);
    const isLifetime = plan === 'lifetime';
    const key       = generateKey({ machineId: cleanMachineId, expiryTs, deviceLimit: dl });
    const priceNum  = Math.max(0, parseFloat(price) || 0);
    const discountedNumRaw = (discountedPrice === '' || discountedPrice === undefined || discountedPrice === null)
        ? priceNum
        : Math.max(0, parseFloat(discountedPrice) || 0);
    const discountedNum  = Math.min(priceNum, discountedNumRaw);
    const discountAmount = Math.max(0, priceNum - discountedNum);

    const license = {
        key,
        plan,
        deviceLimit: dl,
        expiryTs,
        isLifetime,
        price:           priceNum,
        discountedPrice: discountedNum,
        discountAmount,
        machineId:    cleanMachineId,
        clientName:   clientName.trim(),
        clientPhone:      (clientPhone || '').trim(),
        clientEmail:      (clientEmail || '').trim(),
        businessCategory: (businessCategory || '').trim(),
        website:          (website || '').trim() || 'No website',
        notes:            (notes || '').trim(),
        features:     features || DEFAULT_FEATURES,
        issuedBy:     session.sub,
        issuedByName: session.username,
        issuedAt:     Math.floor(Date.now() / 1000),
        activated:    false,
        activatedAt:  null,
        revoked:      false,
        revokedBy:    null,
        revokedByName:null,
        revokedAt:    null,
        revokedReason:null,
    };

    await saveLicense(license);
    return NextResponse.json({ success: true, key, license });
}
