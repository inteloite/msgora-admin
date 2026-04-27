import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { saveAdmin } from '@/lib/kv';

export async function GET() {
    try {
        const username = (process.env.SUPER_ADMIN_USER || 'admin').toLowerCase();
        const pass = process.env.SUPER_ADMIN_PASS || 'changeme123';

        const passwordHash = await bcrypt.hash(pass, 12);
        const id = randomUUID();
        const admin = {
            id,
            username,
            passwordHash,
            createdAt: Math.floor(Date.now() / 1000),
            active: true,
        };

        // Save new admin (saveAdmin handles clearing via overwrite)
        await saveAdmin(admin);

        return NextResponse.json({
            success: true,
            message: `Admin created: username="${username}"`,
            note: 'Delete this route after first login!',
        });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
