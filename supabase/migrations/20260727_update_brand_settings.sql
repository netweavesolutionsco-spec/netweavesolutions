-- Update site_content with correct Netweavesolutions branding
INSERT INTO public.site_content (id, data, published_data) 
VALUES (
  'main',
  jsonb_build_object(
    'brand', jsonb_build_object(
      'name', 'Netweavesolutions',
      'short', 'Netweavesolutions',
      'tagline', 'Transforming Ideas Into Powerful Digital Solutions.',
      'description', 'Premium software development agency crafting websites, apps and custom software that scale.',
      'email', 'netweavesolutions.co@gmail.com',
      'phone', '+91-9876543210',
      'whatsapp', '919876543210',
      'address', 'India',
      'logoUrl', '',
      'logoDarkUrl', '',
      'faviconUrl', ''
    ),
    'social', jsonb_build_object(
      'twitter', 'https://twitter.com',
      'linkedin', 'https://linkedin.com',
      'github', 'https://github.com',
      'instagram', 'https://instagram.com'
    ),
    'nav', jsonb_build_array(
      jsonb_build_object('to', '/', 'label', 'Home', 'enabled', true),
      jsonb_build_object('to', '/about', 'label', 'About', 'enabled', true),
      jsonb_build_object('to', '/services', 'label', 'Services', 'enabled', true),
      jsonb_build_object('to', '/portfolio', 'label', 'Portfolio', 'enabled', true),
      jsonb_build_object('to', '/pricing', 'label', 'Pricing', 'enabled', true),
      jsonb_build_object('to', '/blog', 'label', 'Blog', 'enabled', true),
      jsonb_build_object('to', '/careers', 'label', 'Careers', 'enabled', true),
      jsonb_build_object('to', '/contact', 'label', 'Contact', 'enabled', true)
    ),
    'hero', jsonb_build_object(
      'eyebrow', 'Premium Software Agency',
      'title', 'Transforming Ideas Into Powerful Digital Solutions',
      'subtitle', 'We design, build and scale beautiful digital products for ambitious teams.',
      'ctaPrimary', jsonb_build_object('label', 'Get a Quote', 'to', '/contact'),
      'ctaSecondary', jsonb_build_object('label', 'View Work', 'to', '/portfolio')
    ),
    'footer', jsonb_build_object(
      'copyright', '© Netweavesolutions. All rights reserved.',
      'showNewsletter', true
    ),
    'seo', jsonb_build_object(
      'title', 'Netweavesolutions — Premium Software Development Agency',
      'description', 'Transforming Ideas Into Powerful Digital Solutions.'
    ),
    'theme', jsonb_build_object(
      'primary', '#4F46E5',
      'accent', '#06B6D4',
      'highlight', '#8B5CF6'
    )
  ),
  jsonb_build_object(
    'brand', jsonb_build_object(
      'name', 'Netweavesolutions',
      'short', 'Netweavesolutions',
      'tagline', 'Transforming Ideas Into Powerful Digital Solutions.',
      'description', 'Premium software development agency crafting websites, apps and custom software that scale.',
      'email', 'netweavesolutions.co@gmail.com',
      'phone', '+91-9876543210',
      'whatsapp', '919876543210',
      'address', 'India',
      'logoUrl', '',
      'logoDarkUrl', '',
      'faviconUrl', ''
    ),
    'social', jsonb_build_object(
      'twitter', 'https://twitter.com',
      'linkedin', 'https://linkedin.com',
      'github', 'https://github.com',
      'instagram', 'https://instagram.com'
    ),
    'nav', jsonb_build_array(
      jsonb_build_object('to', '/', 'label', 'Home', 'enabled', true),
      jsonb_build_object('to', '/about', 'label', 'About', 'enabled', true),
      jsonb_build_object('to', '/services', 'label', 'Services', 'enabled', true),
      jsonb_build_object('to', '/portfolio', 'label', 'Portfolio', 'enabled', true),
      jsonb_build_object('to', '/pricing', 'label', 'Pricing', 'enabled', true),
      jsonb_build_object('to', '/blog', 'label', 'Blog', 'enabled', true),
      jsonb_build_object('to', '/careers', 'label', 'Careers', 'enabled', true),
      jsonb_build_object('to', '/contact', 'label', 'Contact', 'enabled', true)
    ),
    'hero', jsonb_build_object(
      'eyebrow', 'Premium Software Agency',
      'title', 'Transforming Ideas Into Powerful Digital Solutions',
      'subtitle', 'We design, build and scale beautiful digital products for ambitious teams.',
      'ctaPrimary', jsonb_build_object('label', 'Get a Quote', 'to', '/contact'),
      'ctaSecondary', jsonb_build_object('label', 'View Work', 'to', '/portfolio')
    ),
    'footer', jsonb_build_object(
      'copyright', '© Netweavesolutions. All rights reserved.',
      'showNewsletter', true
    ),
    'seo', jsonb_build_object(
      'title', 'Netweavesolutions — Premium Software Development Agency',
      'description', 'Transforming Ideas Into Powerful Digital Solutions.'
    ),
    'theme', jsonb_build_object(
      'primary', '#4F46E5',
      'accent', '#06B6D4',
      'highlight', '#8B5CF6'
    )
  )
)
ON CONFLICT (id) DO UPDATE
SET 
  data = EXCLUDED.data,
  published_data = EXCLUDED.published_data,
  updated_at = now();
