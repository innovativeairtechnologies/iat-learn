import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY?.startsWith('re_your')
  ? null
  : new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
const FROM = 'IAT Learn <noreply@iat-learn.com>'

export async function sendSubjectAssignedEmail({
  to,
  displayName,
  subjectTitle,
  subjectId,
}: {
  to: string
  displayName: string
  subjectTitle: string
  subjectId: string
}) {
  if (!resend) return // Resend not configured yet

  await resend.emails.send({
    from: FROM,
    to,
    subject: `New subject assigned: ${subjectTitle}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="margin-bottom:24px">
          <span style="background:#089447;color:white;font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;letter-spacing:0.05em">IAT LEARN</span>
        </div>
        <h1 style="font-size:20px;font-weight:700;color:#0a0a0b;margin:0 0 8px">Hi ${displayName},</h1>
        <p style="font-size:15px;color:#52525b;margin:0 0 24px;line-height:1.6">
          A new subject has been assigned to you:
        </p>
        <div style="background:#f6f6f8;border-radius:12px;padding:16px 20px;margin-bottom:28px">
          <p style="font-size:16px;font-weight:600;color:#0a0a0b;margin:0">${subjectTitle}</p>
        </div>
        <a href="${APP_URL}/learn/${subjectId}" style="display:inline-block;background:#089447;color:white;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">
          Start learning →
        </a>
        <p style="font-size:12px;color:#a1a1aa;margin-top:32px">
          You received this because you have been assigned a subject on IAT Learn.
        </p>
      </div>
    `,
  })
}
