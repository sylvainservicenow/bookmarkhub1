# NextAuth.js Migration Setup

This branch migrates from Supabase Auth to NextAuth.js for more reliable session management.

## Required Environment Variables

Add these to your Vercel project settings:

```env
# NextAuth.js
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=https://www.mybookmarkhub.com  # Your production URL

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for admin operations
```

## How to Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32

## Key Changes

1. **Session Provider**: `SessionProvider` from next-auth replaces `AuthProvider`
2. **useSession Hook**: Replace `useAuth()` with `useSession()` from next-auth
3. **Sign Out**: Use `signOut()` from next-auth/react
4. **Protected Routes**: Middleware uses `withAuth` from next-auth
5. **User ID**: Access via `session.user.id` instead of `user.id`

## Migration Steps

1. Add environment variables to Vercel
2. Deploy the branch
3. Test login/logout flows
4. Test protected routes (dashboard, submit, etc.)
5. If successful, merge to main

## Rollback

If issues occur, simply switch back to the `main` branch which still uses Supabase Auth.
