
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. RBAC: Create role enum
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'admin', 
  'business_owner',
  'freelancer',
  'ambassador',
  'manager'
);

-- 2. RBAC: Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'admin')
  )
$$;

-- Helper: get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'business_owner' THEN 3
      WHEN 'manager' THEN 4
      WHEN 'freelancer' THEN 5
      WHEN 'ambassador' THEN 6
    END
  LIMIT 1
$$;

-- 4. RLS on user_roles: admins manage all, users read own
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 5. Update integrations RLS: admins see all, others see own
DROP POLICY IF EXISTS "Users manage own integrations" ON public.integrations;

CREATE POLICY "Users can view own integrations"
  ON public.integrations FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON public.integrations FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own integrations"
  ON public.integrations FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 6. Update n8n_config RLS
DROP POLICY IF EXISTS "Users manage own n8n config" ON public.n8n_config;

CREATE POLICY "Users can view own n8n config"
  ON public.n8n_config FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own n8n config"
  ON public.n8n_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own n8n config"
  ON public.n8n_config FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own n8n config"
  ON public.n8n_config FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 7. Update n8n_workflows RLS
DROP POLICY IF EXISTS "Users manage own workflows" ON public.n8n_workflows;

CREATE POLICY "Users can view own workflows"
  ON public.n8n_workflows FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own workflows"
  ON public.n8n_workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON public.n8n_workflows FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own workflows"
  ON public.n8n_workflows FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 8. Update oauth_connections RLS
DROP POLICY IF EXISTS "Users manage own oauth connections" ON public.oauth_connections;

CREATE POLICY "Users can view own oauth connections"
  ON public.oauth_connections FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own oauth connections"
  ON public.oauth_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oauth connections"
  ON public.oauth_connections FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own oauth connections"
  ON public.oauth_connections FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 9. Update webhook_events RLS
DROP POLICY IF EXISTS "Users manage own webhook events" ON public.webhook_events;

CREATE POLICY "Users can view own webhook events"
  ON public.webhook_events FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own webhook events"
  ON public.webhook_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhook events"
  ON public.webhook_events FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own webhook events"
  ON public.webhook_events FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 10. Encryption functions using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_secret(plain_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(plain_text, encryption_key),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_secret(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    encryption_key
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 11. Auto-assign default role on first sign-in (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'business_owner')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();
