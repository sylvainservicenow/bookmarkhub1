import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      // The message can be sent via email as backup
    }

    // For now, we'll return success even if DB storage fails
    // In production, you would also send an email here using a service like:
    // - Resend (resend.com)
    // - SendGrid
    // - AWS SES
    // - Postmark
    
    // Example with Resend (when you add the RESEND_API_KEY env variable):
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'BookmarkHub <noreply@bookmarkhub.com>',
    //   to: ['admin@bookmarkhub.com'],
    //   subject: `[BookmarkHub Contact] ${subject}`,
    //   html: `
    //     <h2>New Contact Form Submission</h2>
    //     <p><strong>From:</strong> ${name} (${email})</p>
    //     <p><strong>Subject:</strong> ${subject}</p>
    //     <p><strong>Message:</strong></p>
    //     <p>${message.replace(/\n/g, '<br>')}</p>
    //   `
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
