import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Use Supabase auth to create the user (handles password hashing)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        name,
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create entry in public.users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        name,
        role: 'user',
        status: 'active',
        email_verified: false,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // User was created in auth, but profile failed
      // This is okay, the trigger should handle it or it will be created on first login
    }

    // Check if this is a ServiceNow email
    const isServiceNowEmail = email.toLowerCase().endsWith('@servicenow.com')

    // Send confirmation email using inviteUserByEmail which sends confirmation
    // Note: The user was created above, this just sends the email
    try {
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login?confirmed=true`,
      })
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Continue anyway - user can request new confirmation from login page
    }

    // Send admin notification email for all new registrations
    try {
      const resendApiKey = process.env.RESEND_API_KEY
      if (resendApiKey) {
        // Dynamic import to avoid build-time initialization
        const { Resend } = await import('resend')
        const resend = new Resend(resendApiKey)
        
        const adminEmail = process.env.ADMIN_EMAIL || 'sylvain.hippolyte@servicenow.com'
        const baseUrl = process.env.NEXTAUTH_URL || 'https://bookmarkhub1.vercel.app'
        
        await resend.emails.send({
          from: 'BookmarkHub <noreply@mybookmarkhub.com>',
          to: adminEmail,
          subject: isServiceNowEmail 
            ? `🚨 [ACTION REQUIRED] New ServiceNow user registration: ${name}`
            : `📝 New user registration: ${name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${isServiceNowEmail ? '#d97706' : '#0f766e'};">
                ${isServiceNowEmail ? '⚠️ ServiceNow Email - Manual Approval Needed' : '✅ New User Registration'}
              </h2>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>User ID:</strong> ${authData.user.id}</p>
                <p><strong>Registered at:</strong> ${new Date().toISOString()}</p>
              </div>
              
              ${isServiceNowEmail ? `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e;">
                    <strong>⚠️ This user registered with a @servicenow.com email.</strong><br><br>
                    ServiceNow's email servers block confirmation emails from our domain. 
                    You need to manually confirm this user's email in Supabase.
                  </p>
                </div>
                
                <h3>To manually approve:</h3>
                <ol>
                  <li>Go to <a href="https://supabase.com/dashboard/project/yemqyiqhhxkpmyasvdgy/auth/users">Supabase Dashboard → Auth → Users</a></li>
                  <li>Find user: <strong>${email}</strong></li>
                  <li>Open SQL Editor and run:
                    <pre style="background: #1f2937; color: #f9fafb; padding: 12px; border-radius: 4px; overflow-x: auto;">UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = '${authData.user.id}';</pre>
                  </li>
                </ol>
              ` : `
                <p style="color: #6b7280;">
                  The user will receive a confirmation email. No action needed unless they report issues.
                </p>
              `}
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px;">
                BookmarkHub Admin Notification<br>
                <a href="${baseUrl}/admin">Go to Admin Dashboard</a>
              </p>
            </div>
          `,
        })
        console.log('Admin notification sent for new registration:', email)
      } else {
        console.warn('RESEND_API_KEY not configured, skipping admin notification')
      }
    } catch (notifyError) {
      console.error('Failed to send admin notification:', notifyError)
      // Don't fail registration if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Account created! Please check your email to confirm your account.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
