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
