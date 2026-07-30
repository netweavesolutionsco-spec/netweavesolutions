# Supabase Setup & Integration Guide

## 📋 Overview

This guide will walk you through setting up authentication and database for Netweavesolutions using Supabase.

**Your Supabase Project:**

- Project ID: `bndbozuxtvwxscyfyvex`
- URL: `https://bndbozuxtvwxscyfyvex.supabase.co`
- Dashboard: https://app.supabase.com/projects/bndbozuxtvwxscyfyvex

---

## 🚀 PHASE 1: Database Setup (5-10 minutes)

### Step 1: Run Database Migration

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **Netweavesolutions**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy-paste the entire contents of: `supabase/migrations/001_initial_schema.sql`
6. Click **Run**
7. Verify all tables are created (you should see confirmation messages)

**Tables created:**

- `profiles` - User account information
- `projects` - Portfolio projects
- `blog_posts` - Blog articles
- `testimonials` - Client testimonials
- `team_members` - Team/staff info
- `leads` - Contact form submissions
- `services` - Service offerings

### Step 2: Enable Authentication Methods

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable these providers:
   - ✅ **Email** (already enabled by default)
   - ✅ **Google OAuth** - [Follow setup guide](https://supabase.com/docs/guides/auth/social-auth/auth-google)
   - ✅ **GitHub OAuth** (optional) - [Follow setup guide](https://supabase.com/docs/guides/auth/social-auth/auth-github)

3. Go to **Authentication** → **Email Templates**
4. Customize email templates if desired:
   - Confirmation email
   - Password reset email
   - Magic link email

### Step 3: Set Email Templates Redirect URLs

1. Go to **Authentication** → **Email Templates**
2. For each template, update the redirect URL to:
   ```
   http://localhost:5173/auth?callback=true
   ```
   (For production, change to your domain)

---

## 🔐 PHASE 2: Authentication UI Setup (10-15 minutes)

### Step 1: Create Login Page

File: `src/routes/auth.tsx`

```typescript
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AuthPage() {
  const { signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/auth' });
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }

      navigate({ to: '/client' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h1>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <Input
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
```

### Step 2: Update Existing Routes to Use Auth

Update `src/routes/client.index.tsx`:

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ClientDashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/auth' });
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user.email}</h1>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
            navigate({ to: '/' });
          }}
        >
          Sign Out
        </Button>
      </div>

      {/* Dashboard content */}
    </div>
  );
}
```

---

## 📊 PHASE 3: Use Database in Components (5-10 minutes)

### Example: Display Projects

```typescript
import { useEffect, useState } from 'react';
import { getProjects } from '@/integrations/supabase/database';

export function ProjectShowcase() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects(6)
      .then(({ projects }) => setProjects(projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading projects...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div key={project.id} className="border rounded p-6">
          <h3 className="font-bold">{project.title}</h3>
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example: Submit Lead Form

```typescript
import { useState } from 'react';
import { submitLead } from '@/integrations/supabase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await submitLead(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', company: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting lead:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Your Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <Input
        type="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <Input
        placeholder="Company"
        value={formData.company}
        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
      />
      <textarea
        placeholder="Message"
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        required
        className="w-full p-2 border rounded"
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Message'}
      </Button>
      {submitted && <p className="text-green-600">Message sent successfully!</p>}
    </form>
  );
}
```

---

## 🔒 Protected Routes Setup

Create a route guard component: `src/components/ProtectedRoute.tsx`

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children, requiredRole }: {
  children: ReactNode;
  requiredRole?: string;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/auth' });
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return children;
}
```

---

## 📝 Available Database Functions

All in `src/integrations/supabase/database.ts`:

**Profiles:**

- `getUserProfile(userId)`
- `updateUserProfile(userId, updates)`

**Projects:**

- `getProjects(limit, offset)`
- `getFeaturedProjects(limit)`
- `getUserProjects(userId)`
- `getProject(projectId)`
- `createProject(userId, project)`
- `updateProject(projectId, updates)`
- `deleteProject(projectId)`

**Blog Posts:**

- `getBlogPosts(limit, offset)`
- `getBlogPost(slug)`
- `getUserBlogPosts(userId)`
- `createBlogPost(authorId, post)`
- `updateBlogPost(postId, updates)`
- `deleteBlogPost(postId)`

**Testimonials:**

- `getTestimonials(limit)`
- `getFeaturedTestimonials(limit)`
- `createTestimonial(testimonial)`
- `updateTestimonial(testimonialId, updates)`
- `deleteTestimonial(testimonialId)`

**Team:**

- `getTeamMembers(limit)`
- `createTeamMember(teamMember)`
- `updateTeamMember(memberId, updates)`
- `deleteTeamMember(memberId)`

**Leads:**

- `submitLead(lead)`
- `getLeads(status, limit, offset)`
- `updateLead(leadId, updates)`
- `deleteLead(leadId)`

**Services:**

- `getServices()`
- `createService(service)`
- `updateService(serviceId, updates)`
- `deleteService(serviceId)`

---

## 🌐 Environment Variables (Already Set)

```env
VITE_SUPABASE_URL=https://bndbozuxtvwxscyfyvex.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_nk7gZSpdSXXvivfHCWQe_w_5wNiCqZv
```

---

## 🧪 Testing the Integration

1. **Test Sign Up:**
   - Go to http://localhost:5173/auth
   - Click "Sign Up"
   - Create a test account
   - Check Supabase dashboard - verify user appears in Auth section

2. **Test Database:**
   - Go to Supabase Dashboard → SQL Editor
   - Run: `SELECT * FROM profiles;`
   - Should see your test user

3. **Test Protected Route:**
   - Sign in to http://localhost:5173/auth
   - Navigate to http://localhost:5173/client
   - Should load dashboard (not redirect)

---

## 🚨 Troubleshooting

**Error: "No session"**

- User not authenticated - redirect to `/auth`

**Error: "RLS policy violation"**

- Ensure RLS policies are set correctly (already configured in migration)

**Error: "Email not confirmed"**

- Check email in inbox and click confirmation link

**OAuth not working**

- Verify OAuth provider credentials in Supabase Settings
- Check redirect URL matches exactly

---

## 📚 Next Steps

1. ✅ Run database migration
2. ✅ Enable authentication methods
3. ✅ Create login/signup UI
4. ✅ Integrate into existing pages
5. ✅ Test authentication flow
6. 🔲 Add user profiles page
7. 🔲 Add admin panel
8. 🔲 Add file uploads (storage)
9. 🔲 Deploy to production

---

**Need help?** Check the [Supabase Documentation](https://supabase.com/docs)

