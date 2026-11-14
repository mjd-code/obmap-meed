import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  apiKeyService,
  type ApiKey,
  type ApiKeyPermission,
} from "@/domains/settings/shared/api/ApiKeyService";

export const API_KEY_PERMISSION_OPTIONS: {
  value: ApiKeyPermission;
  label: string;
  description: string;
}[] = [
  { value: "read", label: "Read", description: "View vault data" },
  { value: "write", label: "Write", description: "Create and update data" },
  { value: "delete", label: "Delete", description: "Delete vault data" },
  {
    value: "admin",
    label: "Admin",
    description: "Full access including API key management",
  },
];

/**
 * Headless controller for SettingsApiKeyManager.
 * Manages fetching, creating, permission toggling, copying, and revoking API keys.
 */
export function useSettingsApiKeyController() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<
    ApiKeyPermission[]
  >(["read"]);
  const [newKeyExpiresDays, setNewKeyExpiresDays] = useState<string>("");

  const loadApiKeys = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await apiKeyService.getApiKeys();
    if (error) {
      toast.error("Failed to load API keys");
    } else {
      setApiKeys(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const handleCreateKey = useCallback(async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setIsCreating(true);
    const expiresInDays = newKeyExpiresDays
      ? parseInt(newKeyExpiresDays, 10)
      : undefined;

    const { data, error } = await apiKeyService.createApiKey(
      newKeyName.trim(),
      newKeyPermissions,
      expiresInDays,
    );

    if (error) {
      toast.error("Failed to create API key");
    } else if (data) {
      setNewKeySecret(data.secret);
      setApiKeys((prev) => [data, ...prev]);
      toast.success("API key created successfully");
    }

    setIsCreating(false);
  }, [newKeyExpiresDays, newKeyName, newKeyPermissions]);

  const handleCopySecret = useCallback(() => {
    if (newKeySecret) {
      navigator.clipboard.writeText(newKeySecret);
      toast.success("API key copied to clipboard");
    }
  }, [newKeySecret]);

  const handleCloseCreateDialog = useCallback(() => {
    setShowCreateDialog(false);
    setNewKeyName("");
    setNewKeyPermissions(["read"]);
    setNewKeyExpiresDays("");
    setNewKeySecret(null);
    setShowSecret(false);
  }, []);

  const handleDeleteKey = useCallback(async (keyId: string) => {
    const { error } = await apiKeyService.deleteApiKey(keyId);
    if (error) {
      toast.error("Failed to delete API key");
    } else {
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      toast.success("API key deleted");
    }
  }, []);

  const handleTogglePermission = useCallback((permission: ApiKeyPermission) => {
    setNewKeyPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  }, []);

  return {
    apiKeys,
    isLoading,
    isCreating,
    showCreateDialog,
    setShowCreateDialog,
    newKeySecret,
    showSecret,
    setShowSecret,
    newKeyName,
    setNewKeyName,
    newKeyPermissions,
    newKeyExpiresDays,
    setNewKeyExpiresDays,
    handleCreateKey,
    handleCopySecret,
    handleCloseCreateDialog,
    handleDeleteKey,
    handleTogglePermission,
  };
}
