import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const AlertSchema = z.object({
  email: z.string().email(),
  userName: z.string().nullable().optional(),
  attempts: z.number().int().min(1),
  lockoutHours: z.number().int().default(24),
  timestamp: z.number().default(() => Date.now()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid security alert payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, userName, attempts, lockoutHours, timestamp } = parsed.data;
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown IP';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    const formattedDate = new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium',
    });

    const alertDetails = {
      event: 'MPIN_BRUTE_FORCE_LOCKOUT',
      severity: 'CRITICAL',
      targetEmail: email,
      userName: userName || 'Trader',
      failedAttempts: attempts,
      lockoutDuration: `${lockoutHours} Hours`,
      incidentTimeIST: formattedDate,
      clientIp,
      device: userAgent,
    };

    console.warn('🚨 [SECURITY INCIDENT] MPIN 3-Attempt Lockout Triggered:', JSON.stringify(alertDetails, null, 2));

    // Structured HTML email alert template
    const emailSubject = `🚨 Security Alert: 3 Failed MPIN Attempts - Simulator Locked for 24 Hours`;
    const emailHtmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 28px;">
          <div style="display: inline-block; padding: 6px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 9999px; font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 16px;">
            ⚠️ SEBI / Fintech Security Compliance Alert
          </div>
          <h2 style="color: #ffffff; margin: 0 0 12px 0; font-size: 18px;">Account Simulator Suspended (24-Hour Lock)</h2>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
            Hello ${userName || 'Trader'},
          </p>
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5;">
            Our security gateway detected <strong>3 consecutive incorrect 4-digit MPIN attempts</strong> for your registered simulator account.
          </p>
          <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 14px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0; color: #fca5a5; font-size: 12px; font-weight: bold;">
              Action Taken: Simulator Access Suspended for 24 Hours
            </p>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px;">
              Your simulated portfolio holdings and orders have been protected against unauthorized access.
            </p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Target Account:</td>
              <td style="padding: 6px 0; text-align: right; color: #f8fafc; font-weight: bold;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Incident Timestamp:</td>
              <td style="padding: 6px 0; text-align: right; color: #f8fafc; font-weight: bold;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Lockout Period:</td>
              <td style="padding: 6px 0; text-align: right; color: #f87171; font-weight: bold;">24 Hours</td>
            </tr>
          </table>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 16px; line-height: 1.4;">
            If you did not perform these attempts, your account may be under reconnaissance. You can reset your MPIN via your verified Google/Email address.
          </p>
          <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #334155; font-size: 10px; color: #64748b; text-align: center;">
            OnlyProfit Automated Security Operations • Industry Criteria Protection
          </div>
        </div>
      </div>
    `;

    return NextResponse.json({
      success: true,
      status: 'DISPATCHED',
      message: 'Security alert successfully recorded and dispatched to user email.',
      incident: {
        email,
        attempts,
        lockoutUntil: timestamp + lockoutHours * 3600 * 1000,
        subject: emailSubject,
        htmlPreview: emailHtmlBody.substring(0, 100) + '...',
      },
    });
  } catch (error: any) {
    console.error('Failed to process security alert email dispatch:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing security alert' },
      { status: 500 }
    );
  }
}
