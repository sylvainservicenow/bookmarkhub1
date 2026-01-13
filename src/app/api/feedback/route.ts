import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'

const VALID_TOPICS = ['bug', 'feature', 'improvement', 'content', 'other']

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to submit feedback' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { topic, message } = body

    // Validate required fields
    if (!topic || !message?.trim()) {
      return NextResponse.json(
        { error: 'Topic and message are required' },
        { status: 400 }
      )
    }

    // Validate topic
    if (!VALID_TOPICS.includes(topic)) {
      return NextResponse.json(
        { error: 'Invalid topic selected' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get user info for email
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', session.user.id)
      .single()

    // Insert feedback into database
    const { data: feedback, error: insertError } = await supabase
      .from('feedback')
      .insert({
        user_id: session.user.id,
        topic,
        message: message.trim(),
        status: 'submitted'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing feedback:', insertError)
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      )
    }

    // Send email notification using Resend (if configured)
    // For now, we'll just log it - you can enable Resend when ready
    const topicLabels: Record<string, string> = {
      bug: '🐛 Bug Report',
      feature: '✨ Feature Request',
      improvement: '💡 Improvement',
      content: '📚 Content Issue',
      other: '💬 Other'
    }

    // Email notification logic (can be enabled with Resend)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        await resend.emails.send({
          from: 'BookmarkHub <noreply@mybookmarkhub.com>',
          to: ['admin@mybookmarkhub.com'],
          subject: `[Feedback] ${topicLabels[topic]} from ${userData?.name || 'User'}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">New Feedback Received</h2>
              
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>From:</strong> ${userData?.name || 'Unknown'} (${userData?.email || session.user.email})</p>
                <p style="margin: 10px 0 0;"><strong>Topic:</strong> ${topicLabels[topic]}</p>
              </div>
              
              <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #374151;">Message:</h3>
                <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message.trim()}</p>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  📝 View all feedback at: <a href="https://mybookmarkhub.com/admin/feedback" style="color: #d97706;">Admin Panel</a>
                </p>
              </div>
            </div>
          `
        })
        console.log('Feedback email sent successfully')
      } catch (emailError) {
        // Don't fail the request if email fails
        console.error('Failed to send feedback email:', emailError)
      }
    } else {
      console.log('New feedback received (email disabled):', {
        topic: topicLabels[topic],
        from: userData?.name || session.user.email,
        preview: message.trim().substring(0, 50) + '...'
      })
    }

    return NextResponse.json({ 
      success: true, 
      feedbackId: feedback.id 
    })
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
