import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'onboarding@yourapp.com';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send a transactional email via Resend.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error };
  }
}

/**
 * Send a welcome email to a new user.
 */
export async function sendWelcomeEmail(email: string, name?: string) {
  return sendEmail({
    to: email,
    subject: 'Welcome to our platform!',
    html: `
      <h1>Welcome${name ? `, ${name}` : ''}!</h1>
      <p>Thank you for signing up. We're excited to have you on board.</p>
      <p>Get started by visiting your <a href="${process.env.BASE_URL}/dashboard">dashboard</a>.</p>
    `,
  });
}

/**
 * Send a team invitation email.
 */
export async function sendInvitationEmail(
  email: string,
  teamName: string,
  inviteId: number,
  role: string
) {
  const inviteUrl = `${process.env.BASE_URL}/api/auth/kinde/register?invite_id=${inviteId}`;

  return sendEmail({
    to: email,
    subject: `You've been invited to join ${teamName}`,
    html: `
      <h1>Team Invitation</h1>
      <p>You've been invited to join <strong>${teamName}</strong> as a <strong>${role}</strong>.</p>
      <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Accept Invitation</a></p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    `,
  });
}
