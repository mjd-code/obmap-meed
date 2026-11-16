-- ==============================================================================
-- WAVE 1 SECURITY HARDENING & ROBUST PUBLIC /@username ROUTING MIGRATION
-- Closes 5 Lovable/Supabase Security Findings + Unblocks /:username & /@:username
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SCHEMA PARITY & BACKFILL GUARDS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'account_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.account_status AS ENUM (
      'pending_approval',
      'approved',
      'suspended'
    );
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'approved';

UPDATE public.profiles
SET full_name = COALESCE(full_name, display_name)
WHERE full_name IS NULL
  AND display_name IS NOT NULL;

ALTER TABLE public.user_vaults
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS default_license TEXT NOT NULL DEFAULT 'CC BY-SA 4.0';

-- Promote legacy vaults that already have published notes so /:username routes resolve cleanly
UPDATE public.user_vaults uv
SET visibility = 'public_listed',
    updated_at = now()
WHERE uv.visibility = 'private'
  AND EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.vault_id = uv.id
      AND n.status = 'published'
  );

-- ------------------------------------------------------------------------------
-- 2. PIN search_path ON SECURITY DEFINER FUNCTIONS (Findings #1 & #2)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_vault_role(
  p_user_id UUID,
  p_vault_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL OR p_vault_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_vaults uv
    WHERE uv.id = p_vault_id
      AND uv.user_id = p_user_id
  ) INTO v_is_owner;

  IF v_is_owner THEN
    RETURN 'admin';
  END IF;

  SELECT vm.role::TEXT
    INTO v_role
  FROM public.vault_members vm
  WHERE vm.vault_id = p_vault_id
    AND vm.user_id = p_user_id
  LIMIT 1;

  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_read_vault(
  p_user_id UUID,
  p_vault_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_visibility TEXT;
BEGIN
  IF p_vault_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT uv.visibility
    INTO v_visibility
  FROM public.user_vaults uv
  WHERE uv.id = p_vault_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_visibility IN ('public_listed', 'public_unlisted') THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.vault_id = p_vault_id
      AND n.status = 'published'
  ) THEN
    RETURN TRUE;
  END IF;

  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role = 'superadmin'
  ) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_vaults uv
    WHERE uv.id = p_vault_id
      AND uv.user_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.vault_members vm
    WHERE vm.vault_id = p_vault_id
      AND vm.user_id = p_user_id
  );
END;
$$;

ALTER FUNCTION public.get_vault_role(UUID, UUID) SET search_path = public, pg_catalog;
ALTER FUNCTION public.can_read_vault(UUID, UUID) SET search_path = public, pg_catalog;
ALTER FUNCTION public.is_superadmin() SET search_path = public, pg_catalog;
ALTER FUNCTION public.has_vault_permission(UUID, public.vault_member_role) SET search_path = public, pg_catalog;
ALTER FUNCTION public.can_access_resource(UUID, UUID, TEXT) SET search_path = public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.get_vault_role(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_read_vault(UUID, UUID) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. HARDEN public.profiles RLS & CREATE SANITIZED RPCs (Finding #3)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.shares_vault_with(p_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL OR p_target_user_id IS NULL THEN FALSE
    WHEN auth.uid() = p_target_user_id THEN TRUE
    ELSE EXISTS (
      SELECT 1
      FROM public.user_vaults uv
      WHERE (
        uv.user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.vault_members vm_actor
          WHERE vm_actor.vault_id = uv.id
            AND vm_actor.user_id = auth.uid()
        )
      )
      AND (
        uv.user_id = p_target_user_id
        OR EXISTS (
          SELECT 1
          FROM public.vault_members vm_target
          WHERE vm_target.vault_id = uv.id
            AND vm_target.user_id = p_target_user_id
        )
      )
    )
  END;
$$;

GRANT EXECUTE ON FUNCTION public.shares_vault_with(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users, co-members, and superadmins can view profiles" ON public.profiles;

CREATE POLICY "Users, co-members, and superadmins can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_superadmin()
    OR public.shares_vault_with(user_id)
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users and superadmins can update profiles" ON public.profiles;

CREATE POLICY "Users and superadmins can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_superadmin())
  WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, service_role;

-- Sanitized collaborator search RPC (authenticated only, min query length >= 2, limit 10)
CREATE OR REPLACE FUNCTION public.search_collaborator_profiles(p_query TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_raw TEXT := trim(coalesce(p_query, ''));
  v_escaped TEXT;
  v_is_uuid BOOLEAN := FALSE;
BEGIN
  IF auth.uid() IS NULL OR length(v_raw) < 2 THEN
    RETURN;
  END IF;

  v_is_uuid := v_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_escaped := replace(replace(replace(lower(v_raw), '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.account_status <> 'suspended'
    AND (
      lower(coalesce(p.email, '')) LIKE '%' || v_escaped || '%' ESCAPE '\'
      OR lower(coalesce(p.display_name, '')) LIKE '%' || v_escaped || '%' ESCAPE '\'
      OR lower(coalesce(p.username, '')) LIKE '%' || v_escaped || '%' ESCAPE '\'
      OR (v_is_uuid AND p.user_id = v_raw::UUID)
    )
  ORDER BY
    CASE WHEN lower(coalesce(p.email, '')) = lower(v_raw) THEN 0 ELSE 1 END,
    p.display_name ASC NULLS LAST
  LIMIT 10;
END;
$$;

REVOKE ALL ON FUNCTION public.search_collaborator_profiles(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_collaborator_profiles(TEXT) TO authenticated, service_role;

-- Exact-email collaborator lookup RPC (authenticated only)
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(p_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_clean TEXT := lower(trim(coalesce(p_email, '')));
BEGIN
  IF auth.uid() IS NULL OR v_clean = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE lower(coalesce(p.email, '')) = v_clean
    AND p.account_status <> 'suspended'
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_user_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_user_by_email(TEXT) TO authenticated, service_role;

-- Anon-safe public scholar profile lookup (returns ZERO email/PII columns)
CREATE OR REPLACE FUNCTION public.get_public_profile_by_handle(p_handle TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_public BOOLEAN,
  account_status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_clean TEXT := lower(regexp_replace(trim(coalesce(p_handle, '')), '^@+', ''));
  v_is_uuid BOOLEAN := FALSE;
BEGIN
  IF v_clean = '' THEN
    RETURN;
  END IF;

  v_is_uuid := v_clean ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  RETURN QUERY
  SELECT
    p.user_id,
    p.username,
    p.display_name,
    COALESCE(p.full_name, p.display_name) AS full_name,
    p.avatar_url,
    p.bio,
    p.is_public,
    p.account_status::TEXT
  FROM public.profiles p
  WHERE (v_is_uuid AND p.user_id = v_clean::UUID)
     OR (NOT v_is_uuid AND lower(coalesce(p.username, '')) = v_clean)
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile_by_handle(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_handle(TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. HARDEN public.username_redirects RLS & POINT-LOOKUP RPC (Finding #4)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view redirects" ON public.username_redirects;
DROP POLICY IF EXISTS "Public can read active username redirects" ON public.username_redirects;
DROP POLICY IF EXISTS "Users can view own username redirects" ON public.username_redirects;

CREATE POLICY "Users can view own username redirects"
  ON public.username_redirects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_superadmin());

REVOKE SELECT ON public.username_redirects FROM anon;

CREATE OR REPLACE FUNCTION public.resolve_username_redirect(p_handle TEXT)
RETURNS TABLE (
  user_id UUID,
  old_username TEXT,
  current_username TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_clean TEXT := lower(regexp_replace(trim(coalesce(p_handle, '')), '^@+', ''));
BEGIN
  IF v_clean = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ur.user_id,
    ur.old_username,
    p.username AS current_username,
    ur.expires_at
  FROM public.username_redirects ur
  LEFT JOIN public.profiles p
    ON p.user_id = ur.user_id
  WHERE lower(ur.old_username) = v_clean
    AND ur.expires_at > now()
  ORDER BY ur.created_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_username_redirect(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_username_redirect(TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. ENABLE PUBLIC & COLLABORATOR READ ACCESS ON public.user_vaults
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public and members can view accessible vaults" ON public.user_vaults;

CREATE POLICY "Public and members can view accessible vaults"
  ON public.user_vaults FOR SELECT
  TO anon, authenticated
  USING (
    auth.uid() = user_id
    OR public.is_superadmin()
    OR public.has_vault_permission(id, 'viewer'::public.vault_member_role)
    OR visibility IN ('public_listed', 'public_unlisted')
    OR EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.vault_id = user_vaults.id
        AND n.status = 'published'
    )
  );

GRANT SELECT ON public.user_vaults TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 6. HARDEN storage.objects POLICIES ON BUCKET vault-media (Finding #5)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload vault-media assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their uploaded assets" ON storage.objects;

CREATE POLICY "Authenticated users can upload vault-media assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vault-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can update their uploaded assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vault-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'vault-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
