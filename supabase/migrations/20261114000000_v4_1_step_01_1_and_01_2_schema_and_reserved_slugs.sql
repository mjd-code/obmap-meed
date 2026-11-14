-- ==============================================================================
-- V4.1 (STEP-01.1 & STEP-01.2): SCHEMA PARITY, USERNAME REDIRECTS, VCS CLOUD,
-- AND RESERVED_SLUGS HANDLE PROTECTION
-- ==============================================================================

-- 1. EXTEND public.profiles WITH username & full_name + RESERVED_SLUGS GUARD
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower_unique
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_username_format_and_reserved_check;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_username_format_and_reserved_check
    CHECK (
      username IS NULL OR (
        username ~ '^[a-z0-9_-]{3,30}$'
        AND LOWER(username) NOT IN (
          'app', 'vaults', 'auth', 'admin', 'explore', 'install',
          'settings', 'api', 'assets', 'p', 'pricing', 'docs',
          'help', 'legal', 'about', 'login', 'signup',
          'profile', 'public', 'vault', 'graph', 'root',
          'register', 'dashboard', 'static', 'system',
          'terms', 'privacy', 'status'
        )
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABEL: public.username_redirects (14-day redirect reservation)
CREATE TABLE IF NOT EXISTS public.username_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_username TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_username_redirects_old_lower
  ON public.username_redirects (LOWER(old_username));
CREATE INDEX IF NOT EXISTS idx_username_redirects_expires_at
  ON public.username_redirects (expires_at);

ALTER TABLE public.username_redirects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active username redirects" ON public.username_redirects;
CREATE POLICY "Public can read active username redirects"
  ON public.username_redirects FOR SELECT
  TO anon, authenticated
  USING (expires_at > now());

DROP POLICY IF EXISTS "Users can manage own username redirects" ON public.username_redirects;
CREATE POLICY "Users can manage own username redirects"
  ON public.username_redirects FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR public.is_superadmin())
  WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

GRANT SELECT ON public.username_redirects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.username_redirects TO authenticated, service_role;

-- 3. TABEL: public.vault_branches (VCS Cloud branches)
CREATE TABLE IF NOT EXISTS public.vault_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.user_vaults(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_protected BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  auto_delete_on_merge BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_vault_branch_name UNIQUE (vault_id, name)
);

CREATE INDEX IF NOT EXISTS idx_vault_branches_vault_id ON public.vault_branches(vault_id);

DROP TRIGGER IF EXISTS update_vault_branches_updated_at ON public.vault_branches;
CREATE TRIGGER update_vault_branches_updated_at
  BEFORE UPDATE ON public.vault_branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.vault_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vault members can read branches" ON public.vault_branches;
CREATE POLICY "Vault members can read branches"
  ON public.vault_branches FOR SELECT
  TO authenticated
  USING (public.has_vault_permission(vault_id, 'viewer'::public.vault_member_role));

DROP POLICY IF EXISTS "Editors and admins can manage branches" ON public.vault_branches;
CREATE POLICY "Editors and admins can manage branches"
  ON public.vault_branches FOR ALL
  TO authenticated
  USING (public.has_vault_permission(vault_id, 'editor'::public.vault_member_role))
  WITH CHECK (public.has_vault_permission(vault_id, 'editor'::public.vault_member_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_branches TO authenticated, service_role;

-- 4. TABEL: public.vcs_blobs (Content-addressable deduplicated document blobs)
CREATE TABLE IF NOT EXISTS public.vcs_blobs (
  blob_hash TEXT PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES public.user_vaults(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'text/markdown',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vcs_blobs_vault_id ON public.vcs_blobs(vault_id);

ALTER TABLE public.vcs_blobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vault members can read vcs blobs" ON public.vcs_blobs;
CREATE POLICY "Vault members can read vcs blobs"
  ON public.vcs_blobs FOR SELECT
  TO authenticated
  USING (public.has_vault_permission(vault_id, 'viewer'::public.vault_member_role));

DROP POLICY IF EXISTS "Contributors and above can create vcs blobs" ON public.vcs_blobs;
CREATE POLICY "Contributors and above can create vcs blobs"
  ON public.vcs_blobs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_vault_permission(vault_id, 'contributor'::public.vault_member_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vcs_blobs TO authenticated, service_role;

-- 5. TABEL: public.vcs_commits (Explicit named VCS commits)
CREATE TABLE IF NOT EXISTS public.vcs_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.user_vaults(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.vault_branches(id) ON DELETE CASCADE,
  commit_hash TEXT NOT NULL,
  parent_commit_id UUID REFERENCES public.vcs_commits(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'vault',
  target_path TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  is_revert BOOLEAN NOT NULL DEFAULT false,
  reverted_commit_id UUID REFERENCES public.vcs_commits(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vcs_commits_vault_branch ON public.vcs_commits(vault_id, branch_id, created_at DESC);

ALTER TABLE public.vcs_commits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vault members can read vcs commits" ON public.vcs_commits;
CREATE POLICY "Vault members can read vcs commits"
  ON public.vcs_commits FOR SELECT
  TO authenticated
  USING (public.has_vault_permission(vault_id, 'viewer'::public.vault_member_role));

DROP POLICY IF EXISTS "Contributors and above can write vcs commits" ON public.vcs_commits;
CREATE POLICY "Contributors and above can write vcs commits"
  ON public.vcs_commits FOR ALL
  TO authenticated
  USING (public.has_vault_permission(vault_id, 'contributor'::public.vault_member_role))
  WITH CHECK (public.has_vault_permission(vault_id, 'contributor'::public.vault_member_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vcs_commits TO authenticated, service_role;

-- 6. TABEL: public.vcs_commit_items (Snapshot manifest items per commit)
CREATE TABLE IF NOT EXISTS public.vcs_commit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_id UUID NOT NULL REFERENCES public.vcs_commits(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  blob_hash TEXT NOT NULL REFERENCES public.vcs_blobs(blob_hash) ON DELETE RESTRICT,
  item_type TEXT NOT NULL DEFAULT 'file',
  title TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'modified',
  size_bytes INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vcs_commit_items_commit_id ON public.vcs_commit_items(commit_id);

ALTER TABLE public.vcs_commit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vault members can read vcs commit items" ON public.vcs_commit_items;
CREATE POLICY "Vault members can read vcs commit items"
  ON public.vcs_commit_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vcs_commits c
      WHERE c.id = commit_id
        AND public.has_vault_permission(c.vault_id, 'viewer'::public.vault_member_role)
    )
  );

DROP POLICY IF EXISTS "Contributors and above can write vcs commit items" ON public.vcs_commit_items;
CREATE POLICY "Contributors and above can write vcs commit items"
  ON public.vcs_commit_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vcs_commits c
      WHERE c.id = commit_id
        AND public.has_vault_permission(c.vault_id, 'contributor'::public.vault_member_role)
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vcs_commit_items TO authenticated, service_role;

-- 7. TABEL: public.vcs_merge_requests (Branch merge proposals)
CREATE TABLE IF NOT EXISTS public.vcs_merge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.user_vaults(id) ON DELETE CASCADE,
  source_branch_id UUID NOT NULL REFERENCES public.vault_branches(id) ON DELETE CASCADE,
  target_branch_id UUID NOT NULL REFERENCES public.vault_branches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  author_id UUID NOT NULL,
  merged_by UUID,
  merged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vcs_merge_requests_vault_id ON public.vcs_merge_requests(vault_id);

DROP TRIGGER IF EXISTS update_vcs_merge_requests_updated_at ON public.vcs_merge_requests;
CREATE TRIGGER update_vcs_merge_requests_updated_at
  BEFORE UPDATE ON public.vcs_merge_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.vcs_merge_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vault members can read merge requests" ON public.vcs_merge_requests;
CREATE POLICY "Vault members can read merge requests"
  ON public.vcs_merge_requests FOR SELECT
  TO authenticated
  USING (public.has_vault_permission(vault_id, 'viewer'::public.vault_member_role));

DROP POLICY IF EXISTS "Contributors and above can create merge requests" ON public.vcs_merge_requests;
CREATE POLICY "Contributors and above can create merge requests"
  ON public.vcs_merge_requests FOR INSERT
  TO authenticated
  WITH CHECK (public.has_vault_permission(vault_id, 'contributor'::public.vault_member_role));

DROP POLICY IF EXISTS "Editors and admins can update merge requests" ON public.vcs_merge_requests;
CREATE POLICY "Editors and admins can update merge requests"
  ON public.vcs_merge_requests FOR UPDATE
  TO authenticated
  USING (public.has_vault_permission(vault_id, 'editor'::public.vault_member_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vcs_merge_requests TO authenticated, service_role;
