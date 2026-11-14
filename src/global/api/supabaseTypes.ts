export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json
          resource_id: string
          resource_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json
          resource_id: string
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          resource_id?: string
          resource_type?: string
        }
        Relationships: []
      }
      note_links: {
        Row: {
          created_at: string
          id: string
          source_note_id: string
          target_note_id: string | null
          target_slug: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_note_id: string
          target_note_id?: string | null
          target_slug: string
          vault_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source_note_id?: string
          target_note_id?: string | null
          target_slug?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_links_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_links_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_links_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      note_revisions: {
        Row: {
          content: string
          created_at: string
          created_by: string
          diff_summary: string | null
          frontmatter: Json
          id: string
          note_id: string
          title: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          diff_summary?: string | null
          frontmatter?: Json
          id?: string
          note_id: string
          title: string
          version: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          diff_summary?: string | null
          frontmatter?: Json
          id?: string
          note_id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "note_revisions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          frontmatter: Json
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["note_status"]
          title: string
          updated_at: string
          vault_id: string
          version: number
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          frontmatter?: Json
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["note_status"]
          title?: string
          updated_at?: string
          vault_id: string
          version?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          frontmatter?: Json
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["note_status"]
          title?: string
          updated_at?: string
          vault_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "notes_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          email_verified: boolean
          full_name: string | null
          id: string
          is_public: boolean
          last_login_attempt: string | null
          login_attempts: number
          preferences: Json | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified?: boolean
          full_name?: string | null
          id?: string
          is_public?: boolean
          last_login_attempt?: string | null
          login_attempts?: number
          preferences?: Json | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified?: boolean
          full_name?: string | null
          id?: string
          is_public?: boolean
          last_login_attempt?: string | null
          login_attempts?: number
          preferences?: Json | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      partner_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_code: string
          invited_by: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invite_code: string
          invited_by: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_code?: string
          invited_by?: string
          status?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      share_links: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          note_id: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["vault_member_role"]
          token_hash: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          note_id?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["vault_member_role"]
          token_hash: string
          vault_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          note_id?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["vault_member_role"]
          token_hash?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          data: Json
          device_id: string | null
          id: string
          section: string
          updated_at: string
          user_id: string
          vault_id: string | null
          version: number
        }
        Insert: {
          created_at?: string
          data?: Json
          device_id?: string | null
          id?: string
          section: string
          updated_at?: string
          user_id: string
          vault_id?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          data?: Json
          device_id?: string | null
          id?: string
          section?: string
          updated_at?: string
          user_id?: string
          vault_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vaults: {
        Row: {
          backup_config: Json | null
          created_at: string
          default_license: string
          description: string | null
          encryption_key_hash: string | null
          graph_config: Json | null
          graph_data: Json
          id: string
          is_encrypted: boolean
          last_synced_at: string | null
          name: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          backup_config?: Json | null
          created_at?: string
          default_license?: string
          description?: string | null
          encryption_key_hash?: string | null
          graph_config?: Json | null
          graph_data?: Json
          id?: string
          is_encrypted?: boolean
          last_synced_at?: string | null
          name: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          backup_config?: Json | null
          created_at?: string
          default_license?: string
          description?: string | null
          encryption_key_hash?: string | null
          graph_config?: Json | null
          graph_data?: Json
          id?: string
          is_encrypted?: boolean
          last_synced_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      username_redirects: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          old_username: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          old_username: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          old_username?: string
          user_id?: string
        }
        Relationships: []
      }
      vault_backups: {
        Row: {
          created_at: string
          id: string
          links: Json
          nodes: Json
          reason: string | null
          user_id: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          links?: Json
          nodes?: Json
          reason?: string | null
          user_id: string
          vault_id: string
        }
        Update: {
          created_at?: string
          id?: string
          links?: Json
          nodes?: Json
          reason?: string | null
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_backups_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_branches: {
        Row: {
          auto_delete_on_merge: boolean
          created_at: string
          created_by: string
          id: string
          is_archived: boolean
          is_default: boolean
          is_protected: boolean
          name: string
          updated_at: string
          vault_id: string
        }
        Insert: {
          auto_delete_on_merge?: boolean
          created_at?: string
          created_by: string
          id?: string
          is_archived?: boolean
          is_default?: boolean
          is_protected?: boolean
          name: string
          updated_at?: string
          vault_id: string
        }
        Update: {
          auto_delete_on_merge?: boolean
          created_at?: string
          created_by?: string
          id?: string
          is_archived?: boolean
          is_default?: boolean
          is_protected?: boolean
          name?: string
          updated_at?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_branches_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_history: {
        Row: {
          created_at: string
          id: string
          snapshot: Json
          user_id: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          snapshot: Json
          user_id: string
          vault_id: string
        }
        Update: {
          created_at?: string
          id?: string
          snapshot?: Json
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_history_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["vault_member_role"]
          updated_at: string
          user_id: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["vault_member_role"]
          updated_at?: string
          user_id: string
          vault_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["vault_member_role"]
          updated_at?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_members_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vcs_blobs: {
        Row: {
          blob_hash: string
          content_text: string
          created_at: string
          mime_type: string
          size_bytes: number
          vault_id: string
        }
        Insert: {
          blob_hash: string
          content_text: string
          created_at?: string
          mime_type?: string
          size_bytes?: number
          vault_id: string
        }
        Update: {
          blob_hash?: string
          content_text?: string
          created_at?: string
          mime_type?: string
          size_bytes?: number
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vcs_blobs_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vcs_commit_items: {
        Row: {
          blob_hash: string
          change_type: string
          commit_id: string
          id: string
          item_type: string
          path: string
          size_bytes: number
          title: string
        }
        Insert: {
          blob_hash: string
          change_type?: string
          commit_id: string
          id?: string
          item_type?: string
          path: string
          size_bytes?: number
          title: string
        }
        Update: {
          blob_hash?: string
          change_type?: string
          commit_id?: string
          id?: string
          item_type?: string
          path?: string
          size_bytes?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vcs_commit_items_blob_hash_fkey"
            columns: ["blob_hash"]
            isOneToOne: false
            referencedRelation: "vcs_blobs"
            referencedColumns: ["blob_hash"]
          },
          {
            foreignKeyName: "vcs_commit_items_commit_id_fkey"
            columns: ["commit_id"]
            isOneToOne: false
            referencedRelation: "vcs_commits"
            referencedColumns: ["id"]
          },
        ]
      }
      vcs_commits: {
        Row: {
          author_id: string
          branch_id: string
          commit_hash: string
          created_at: string
          id: string
          is_revert: boolean
          message: string
          parent_commit_id: string | null
          reverted_commit_id: string | null
          scope: string
          target_path: string | null
          vault_id: string
        }
        Insert: {
          author_id: string
          branch_id: string
          commit_hash: string
          created_at?: string
          id?: string
          is_revert?: boolean
          message: string
          parent_commit_id?: string | null
          reverted_commit_id?: string | null
          scope?: string
          target_path?: string | null
          vault_id: string
        }
        Update: {
          author_id?: string
          branch_id?: string
          commit_hash?: string
          created_at?: string
          id?: string
          is_revert?: boolean
          message?: string
          parent_commit_id?: string | null
          reverted_commit_id?: string | null
          scope?: string
          target_path?: string | null
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vcs_commits_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vcs_commits_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "vault_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vcs_commits_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vcs_merge_requests: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          merged_at: string | null
          merged_by: string | null
          source_branch_id: string
          status: string
          target_branch_id: string
          title: string
          updated_at: string
          vault_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          source_branch_id: string
          status?: string
          target_branch_id: string
          title: string
          updated_at?: string
          vault_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          source_branch_id?: string
          status?: string
          target_branch_id?: string
          title?: string
          updated_at?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vcs_merge_requests_source_branch_id_fkey"
            columns: ["source_branch_id"]
            isOneToOne: false
            referencedRelation: "vault_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vcs_merge_requests_target_branch_id_fkey"
            columns: ["target_branch_id"]
            isOneToOne: false
            referencedRelation: "vault_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vcs_merge_requests_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "user_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_resource: {
        Args: {
          _action: string
          _user_id: string | null
          _vault_id: string
        }
        Returns: boolean
      }
      has_vault_permission: {
        Args: {
          _required_role: Database["public"]["Enums"]["vault_member_role"]
          _vault_id: string
        }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      account_status: "pending_approval" | "approved" | "suspended"
      app_role: "superadmin" | "member"
      note_status: "draft" | "in_review" | "published" | "archived"
      release_stage: "stage_1_partner" | "stage_2_community_beta" | "stage_3_commercial_ga"
      vault_member_role: "admin" | "editor" | "contributor" | "commenter" | "viewer" | "guest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["pending_approval", "approved", "suspended"],
      app_role: ["superadmin", "member"],
      note_status: ["draft", "in_review", "published", "archived"],
      release_stage: ["stage_1_partner", "stage_2_community_beta", "stage_3_commercial_ga"],
      vault_member_role: ["admin", "editor", "contributor", "commenter", "viewer", "guest"],
    },
  },
} as const
