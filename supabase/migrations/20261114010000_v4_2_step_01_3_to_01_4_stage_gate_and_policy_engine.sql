-- ObMap v4.2 Migration (STEP-01.3 & STEP-01.4)
-- Implements:
--   1. Release Stage Gate & Individual Per-User Admin Approval Queue (ADR-0009, FR-STAGE-001..003)
--   2. 4-State Vault Visibility State Machine, Default CC BY-SA 4.0 License, Share Links,
--      Extended Vault Roles ('commenter', 'guest'), and Symmetric can_access_resource() (ADR-0009, ADR-0010)

-- ---------------------------------------------------------------------------
-- 1. Release Stage & Account Status Enums + Profiles Account Status
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'release_stage' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.release_stage AS ENUM (
      'stage_1_partner',
      'stage_2_community_beta',
      'stage_3_commercial_ga'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.account_status AS ENUM (
      'pending_approval',
      'approved',
      'suspended'
    );
  END IF;
END$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS idx_profiles_account_status
  ON public.profiles(account_status);

-- ---------------------------------------------------------------------------
-- 2. Platform Settings (release_stage runtime switch, seeded Stage 1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (key, value)
VALUES ('release_stage', '"stage_1_partner"'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_public_read" ON public.platform_settings;
CREATE POLICY "platform_settings_public_read"
  ON public.platform_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "platform_settings_superadmin_write" ON public.platform_settings;
CREATE POLICY "platform_settings_superadmin_write"
  ON public.platform_settings
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

GRANT SELECT ON public.platform_settings TO anon;
GRANT ALL ON public.platform_settings TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Partner Invitations (Stage 1 Closed Partner Pilot)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL,
  accepted_by UUID,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_invitations_code
  ON public.partner_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_email
  ON public.partner_invitations(lower(email));

ALTER TABLE public.partner_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_invitations_superadmin_all" ON public.partner_invitations;
CREATE POLICY "partner_invitations_superadmin_all"
  ON public.partner_invitations
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "partner_invitations_redeem_self" ON public.partner_invitations;
CREATE POLICY "partner_invitations_redeem_self"
  ON public.partner_invitations
  FOR SELECT
  TO authenticated
  USING (
    status = 'pending'
    AND (
      lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      OR accepted_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "partner_invitations_accept_self" ON public.partner_invitations;
CREATE POLICY "partner_invitations_accept_self"
  ON public.partner_invitations
  FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND expires_at > now()
    AND (
      lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      OR accepted_by IS NULL
    )
  )
  WITH CHECK (
    status = 'accepted'
    AND accepted_by = auth.uid()
  );

GRANT ALL ON public.partner_invitations TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Extended Vault Roles & 4-State Visibility + Default CC BY-SA 4.0 License
-- ---------------------------------------------------------------------------
ALTER TYPE public.vault_member_role ADD VALUE IF NOT EXISTS 'commenter';
ALTER TYPE public.vault_member_role ADD VALUE IF NOT EXISTS 'guest';

ALTER TABLE public.user_vaults
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'shared', 'public_unlisted', 'public_listed'));

ALTER TABLE public.user_vaults
  ADD COLUMN IF NOT EXISTS default_license TEXT NOT NULL DEFAULT 'CC BY-SA 4.0';

CREATE INDEX IF NOT EXISTS idx_user_vaults_visibility
  ON public.user_vaults(visibility);

-- ---------------------------------------------------------------------------
-- 5. Share Links Table (Secret Capability Tokens for Shared Vaults/Notes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.user_vaults(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  role public.vault_member_role NOT NULL DEFAULT 'guest',
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_links_vault_id
  ON public.share_links(vault_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token_hash
  ON public.share_links(token_hash);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "share_links_owner_admin_manage" ON public.share_links;
CREATE POLICY "share_links_owner_admin_manage"
  ON public.share_links
  FOR ALL
  TO authenticated
  USING (
    public.is_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.user_vaults uv
      WHERE uv.id = share_links.vault_id AND uv.user_id = auth.uid()
    )
    OR public.has_vault_permission(share_links.vault_id, 'admin'::public.vault_member_role)
  )
  WITH CHECK (
    public.is_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.user_vaults uv
      WHERE uv.id = share_links.vault_id AND uv.user_id = auth.uid()
    )
    OR public.has_vault_permission(share_links.vault_id, 'admin'::public.vault_member_role)
  );

GRANT ALL ON public.share_links TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Symmetric Two-Layer RBAC Helper: public.can_access_resource
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_resource(
  _user_id UUID,
  _vault_id UUID,
  _action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_visibility TEXT;
  v_member_role TEXT;
  v_account_status TEXT;
  v_is_superadmin BOOLEAN := FALSE;
BEGIN
  IF _vault_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT uv.user_id, uv.visibility
    INTO v_owner_id, v_visibility
  FROM public.user_vaults uv
  WHERE uv.id = _vault_id;

  IF v_owner_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF _user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id AND ur.role = 'superadmin'
    ) INTO v_is_superadmin;

    IF v_is_superadmin THEN
      RETURN TRUE;
    END IF;

    SELECT p.account_status::TEXT
      INTO v_account_status
    FROM public.profiles p
    WHERE p.user_id = _user_id;

    -- Layer 1: Deny mutations/workspace access if account is pending_approval or suspended
    IF v_account_status IS NOT NULL AND v_account_status <> 'approved' THEN
      IF _action <> 'note:read_public' THEN
        RETURN FALSE;
      END IF;
    END IF;

    -- Layer 2: Vault owner
    IF v_owner_id = _user_id THEN
      RETURN TRUE;
    END IF;

    -- Layer 2: Vault member role
    SELECT vm.role::TEXT
      INTO v_member_role
    FROM public.vault_members vm
    WHERE vm.vault_id = _vault_id AND vm.user_id = _user_id;

    IF v_member_role IS NOT NULL THEN
      IF _action IN ('vault:read', 'read', 'note:read_public') THEN
        RETURN TRUE;
      ELSIF _action IN ('vault:comment', 'comment') THEN
        RETURN v_member_role IN ('commenter', 'contributor', 'editor', 'admin');
      ELSIF _action IN ('vault:edit', 'edit') THEN
        RETURN v_member_role IN ('contributor', 'editor', 'admin');
      ELSIF _action IN ('vault:review', 'vault:publish', 'review', 'publish') THEN
        RETURN v_member_role IN ('editor', 'admin');
      ELSIF _action IN ('vault:manage_members', 'vault:manage_visibility', 'manage_members') THEN
        RETURN v_member_role = 'admin';
      END IF;
    END IF;
  END IF;

  -- Anonymous or non-member public read check
  IF _action IN ('vault:read', 'read', 'note:read_public')
     AND v_visibility IN ('public_unlisted', 'public_listed') THEN
    SELECT p.account_status::TEXT
      INTO v_account_status
    FROM public.profiles p
    WHERE p.user_id = v_owner_id;

    RETURN coalesce(v_account_status, 'approved') = 'approved';
  END IF;

  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_access_resource(UUID, UUID, TEXT) TO anon, authenticated, service_role;
