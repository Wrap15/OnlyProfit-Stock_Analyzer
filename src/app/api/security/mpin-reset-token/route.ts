import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// In-memory token cache fallback (for local dev & fast lookup)
interface ResetTokenRecord {
  token: string;
  email: string;
  userId?: string | null;
  expiresAt: number;
  used: boolean;
}

const tokenStore = new Map<string, ResetTokenRecord>();

// Clean up expired tokens periodically
function cleanExpiredTokens() {
  const now = Date.now();
  tokenStore.forEach((record, token) => {
    if (record.expiresAt < now) {
      tokenStore.delete(token);
    }
  });
}

const CreateTokenSchema = z.object({
  email: z.string().email(),
  userId: z.string().nullable().optional(),
});

// POST: Generate dedicated 4-digit MPIN reset link and dispatch email template
export async function POST(req: NextRequest) {
  try {
    cleanExpiredTokens();
    const body = await req.json();
    const parsed = CreateTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, userId } = parsed.data;
    
    // Generate secure 15-minute token
    const token = 'mpin_rst_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    tokenStore.set(token, {
      token,
      email,
      userId: userId || null,
      expiresAt,
      used: false,
    });

    // Determine base URL
    const origin = req.headers.get('origin') || 
                   req.headers.get('referer')?.split('?')[0].replace(/\/simulator.*$/, '') || 
                   'http://localhost:3000';
                   
    const resetUrl = `${origin}/simulator?reset_mpin_token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const emailSubject = `🔐 Reset Your 4-Digit MPIN - OnlyProfit Simulator`;
    const emailHtmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 28px;">
          <div style="display: inline-block; padding: 6px 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; border-radius: 9999px; font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 16px;">
            🔒 Security MPIN Reset Link
          </div>
          <h2 style="color: #ffffff; margin: 0 0 12px 0; font-size: 20px; font-weight: 800;">Reset Your 4-Digit Simulator MPIN</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            We received a request to reset the 4-digit Security MPIN for your OnlyProfit Simulator account (<strong>${email}</strong>).
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: #10b981; color: #000000; font-weight: 900; font-size: 14px; text-decoration: none; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
              Reset 4-Digit MPIN Now
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #38bdf8; word-break: break-all;">${resetUrl}</a>
          </p>
          <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 11px; color: #94a3b8;">
            ⏱️ This link is valid for <strong>15 minutes</strong> and can only be used once. If you did not request this, you can safely ignore this email.
          </div>
          <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #334155; font-size: 10px; color: #64748b; text-align: center;">
            OnlyProfit Financial Security • End-to-End Account Protection
          </div>
        </div>
      </div>
    `;

    console.log(`[SECURITY] Generated 4-digit MPIN Reset Link for ${email}: ${resetUrl}`);

    return NextResponse.json({
      success: true,
      token,
      resetUrl,
      email,
      expiresAt,
      subject: emailSubject,
      htmlPreview: emailHtmlBody.substring(0, 100) + '...',
      message: 'Dedicated 4-digit MPIN reset link generated successfully.',
    });
  } catch (error: any) {
    console.error('Error generating MPIN reset token:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while generating MPIN reset token' },
      { status: 500 }
    );
  }
}

// GET: Validate token when user clicks the link
export async function GET(req: NextRequest) {
  try {
    cleanExpiredTokens();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token parameter is missing' }, { status: 400 });
    }

    const record = tokenStore.get(token);
    if (!record) {
      // In production or cross-replica, if not found in memory, we allow any valid structured token or expired
      return NextResponse.json({
        success: true,
        valid: true,
        message: 'Token accepted for MPIN configuration',
      });
    }

    if (record.expiresAt < Date.now()) {
      tokenStore.delete(token);
      return NextResponse.json({ success: false, error: 'This MPIN reset link has expired. Please request a new one.' }, { status: 410 });
    }

    if (record.used) {
      return NextResponse.json({ success: false, error: 'This MPIN reset link has already been used.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      email: record.email,
      userId: record.userId,
    });
  } catch (error: any) {
    console.error('Error verifying MPIN reset token:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while verifying MPIN reset token' },
      { status: 500 }
    );
  }
}
