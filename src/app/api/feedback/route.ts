import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@/lib/supabase/server'
import { authOptions } from '@/lib/auth/options'

const VALID_TOPICS = ['bug', 'feature', 'improvement', 'content', 'other']

export async function POST(request: NextRequest) {
  try {
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions)
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

    // Get user info for logging
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

    // Log the feedback (email can be added later with Resend package)
    const topicLabels: Record<string, string> = {
      bug: '🐛 Bug Report',
      feature: '✨ Feature Request',
      improvement: '💡 Improvement',
      content: '📚 Content Issue',
      other: '💬 Other'
    }

    console.log('New feedback received:', {
      id: feedback.id,
      topic: topicLabels[topic],
      from: userData?.name || session.user.email,
      preview: message.trim().substring(0, 50) + (message.trim().length > 50 ? '...' : '')
    })

    // TODO: Email notification can be added later by:
    // 1. npm install resend
    // 2. Add RESEND_API_KEY to env
    // 3. Uncomment and use Resend to send email to admin@mybookmarkhub.com

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
