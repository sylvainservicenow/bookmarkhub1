import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'
import { authOptions } from '@/lib/auth/options'
import { notifyNewFeedback } from '@/lib/email'

const VALID_TOPICS = ['bug', 'feature', 'improvement', 'content', 'other']

// Create admin client to bypass RLS (since we use NextAuth, not Supabase Auth)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

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
    const { topic, message, pageUrl } = body

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

    const supabaseAdmin = getSupabaseAdmin()

    // Get user info for logging and notification
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('id', session.user.id)
      .single()

    // Insert feedback into database
    const { data: feedback, error: insertError } = await supabaseAdmin
      .from('feedback')
      .insert({
        user_id: session.user.id,
        topic,
        message: message.trim(),
        page_url: pageUrl || null,
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

    // Log the feedback
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
      page: pageUrl || 'unknown',
      preview: message.trim().substring(0, 50) + (message.trim().length > 50 ? '...' : '')
    })

    // Send email notification to admin (fire and forget - don't block response)
    notifyNewFeedback({
      id: feedback.id,
      topic,
      message: message.trim(),
      pageUrl: pageUrl || undefined,
      userName: userData?.name || undefined,
      userEmail: userData?.email || session.user.email || undefined,
    }).catch((err) => {
      console.error('Failed to send feedback notification email:', err)
    })

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
