
-- =========================
-- Enums & Profiles & Roles
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto-create profile + first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- Site content (singleton)
-- =========================
CREATE TABLE public.site_content (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone (public site) can read
CREATE POLICY "site_content_public_read" ON public.site_content FOR SELECT USING (true);
-- Only admins can write
CREATE POLICY "site_content_admin_insert" ON public.site_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "site_content_admin_update" ON public.site_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_content_set_updated_at BEFORE UPDATE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the singleton row
INSERT INTO public.site_content (id, data, published_data) VALUES (
  'main',
  '{
    "brand": {
      "name": "Netweavesolutions",
      "short": "Netweavesolutions",
      "tagline": "Transforming Ideas Into Powerful Digital Solutions.",
      "description": "Premium software development agency crafting websites, apps and custom software that scale.",
      "email": "hello@company.com",
      "phone": "+91-9876543210",
      "whatsapp": "919876543210",
      "address": "India",
      "logoUrl": "",
      "logoDarkUrl": "",
      "faviconUrl": ""
    },
    "social": {
      "twitter": "https://twitter.com",
      "linkedin": "https://linkedin.com",
      "github": "https://github.com",
      "instagram": "https://instagram.com"
    },
    "nav": [
      {"to": "/", "label": "Home", "enabled": true},
      {"to": "/about", "label": "About", "enabled": true},
      {"to": "/services", "label": "Services", "enabled": true},
      {"to": "/portfolio", "label": "Portfolio", "enabled": true},
      {"to": "/pricing", "label": "Pricing", "enabled": true},
      {"to": "/blog", "label": "Blog", "enabled": true},
      {"to": "/careers", "label": "Careers", "enabled": true},
      {"to": "/contact", "label": "Contact", "enabled": true}
    ],
    "hero": {
      "eyebrow": "Premium Software Agency",
      "title": "Transforming Ideas Into Powerful Digital Solutions",
      "subtitle": "We design, build and scale beautiful digital products for ambitious teams.",
      "ctaPrimary": {"label": "Get a Quote", "to": "/contact"},
      "ctaSecondary": {"label": "View Work", "to": "/portfolio"}
    },
    "footer": {
      "copyright": "© Netweavesolutions. All rights reserved.",
      "showNewsletter": true
    },
    "seo": {
      "title": "Netweavesolutions — Premium Software Development Agency",
      "description": "Transforming Ideas Into Powerful Digital Solutions."
    },
    "theme": {
      "primary": "#4F46E5",
      "accent": "#06B6D4",
      "highlight": "#8B5CF6"
    }
  }'::jsonb,
  '{}'::jsonb
);

-- Publish the seed data
UPDATE public.site_content SET published_data = data WHERE id = 'main';

