import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email send')
    return { success: false, error: 'Email service not configured' }
  }

  if (!process.env.FROM_EMAIL) {
    console.warn('FROM_EMAIL not set, skipping email send')
    return { success: false, error: 'FROM_EMAIL not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendAdminNotification(subject: string, html: string) {
  if (!process.env.ADMIN_EMAIL) {
    console.warn('ADMIN_EMAIL not set, skipping admin notification')
    return { success: false, error: 'ADMIN_EMAIL not configured' }
  }

  return sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `[BookmarkHub] ${subject}`,
    html,
  })
}

// Specific notification functions
export async function notifyNewFeedback(feedback: {
  id: string
  topic: string
  message: string
  pageUrl?: string
  userName?: string
  userEmail?: string
}) {
  const topicLabels: Record<string, string> = {
    bug: '🐛 Bug Report',
    feature: '✨ Feature Request',
    improvement: '💡 Improvement',
    content: '📚 Content Issue',
    other: '💬 Other',
  }

  const topicLabel = topicLabels[feedback.topic] || feedback.topic

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
        New Feedback Submitted
      </h2>
      
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;">
          <strong style="color: #6b7280;">Topic:</strong> 
          <span style="color: #1f2937;">${topicLabel}</span>
        </p>
        <p style="margin: 0 0 8px 0;">
          <strong style="color: #6b7280;">From:</strong> 
          <span style="color: #1f2937;">${feedback.userName || feedback.userEmail || 'Unknown user'}</span>
        </p>
        ${feedback.pageUrl ? `
        <p style="margin: 0 0 8px 0;">
          <strong style="color: #6b7280;">Page:</strong> 
          <span style="color: #1f2937;">${feedback.pageUrl}</span>
        </p>
        ` : ''}
      </div>

      <div style="background: #fff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Message</p>
        <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${feedback.message}</p>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <a href="https://mybookmarkhub.com/admin/feedback" 
           style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Review in Admin Panel
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
        This is an automated notification from BookmarkHub
      </p>
    </div>
  `

  return sendAdminNotification(`New ${topicLabel}`, html)
}
