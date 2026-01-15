import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAdminNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Store the contact message in Supabase
    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        subject,
        message,
        status: 'new'
      })

    if (insertError) {
      console.error('Error storing contact message:', insertError)
      // If table doesn't exist, we'll just log and continue
    }

    // Send email notification to admin (fire and forget)
    const subjectLabels: Record<string, string> = {
      general: 'General Inquiry',
      support: 'Technical Support',
      feedback: 'Feedback',
      bug: 'Bug Report',
      feature: 'Feature Request',
      other: 'Other',
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;">
            <strong style="color: #6b7280;">From:</strong> 
            <span style="color: #1f2937;">${name} (${email})</span>
          </p>
          <p style="margin: 0;">
            <strong style="color: #6b7280;">Subject:</strong> 
            <span style="color: #1f2937;">${subjectLabels[subject] || subject}</span>
          </p>
        </div>

        <div style="background: #fff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Message</p>
          <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${message}</p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
          This is an automated notification from BookmarkHub
        </p>
      </div>
    `

    sendAdminNotification(`Contact: ${subjectLabels[subject] || subject}`, html).catch((err) => {
      console.error('Failed to send contact notification email:', err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
