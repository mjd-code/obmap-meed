import { format } from "date-fns";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Label } from "@/global/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/global/ui/card";
import { Badge } from "@/global/ui/badge";
import { Checkbox } from "@/global/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/global/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/global/ui/alert-dialog";
import {
  API_KEY_PERMISSION_OPTIONS,
  useSettingsApiKeyController,
} from "@/domains/settings/shared/hooks/useSettingsApiKeyController";

/** Declarative view for creating, listing, and revoking vault API keys. */
export function ApiKeyManager() {
  const ctrl = useSettingsApiKeyController();

  if (ctrl.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for programmatic access to your vaults
            </CardDescription>
          </div>
          <Dialog
            open={ctrl.showCreateDialog}
            onOpenChange={ctrl.setShowCreateDialog}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {ctrl.newKeySecret
                    ? "API Key Created"
                    : "Create New API Key"}
                </DialogTitle>
                <DialogDescription>
                  {ctrl.newKeySecret
                    ? "Copy this key now. You won't be able to see it again."
                    : "Create a new API key with specific permissions."}
                </DialogDescription>
              </DialogHeader>

              {ctrl.newKeySecret ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm break-all">
                        {ctrl.showSecret ? ctrl.newKeySecret : "•".repeat(40)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => ctrl.setShowSecret(!ctrl.showSecret)}
                      >
                        {ctrl.showSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={ctrl.handleCopySecret}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={ctrl.handleCloseCreateDialog}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g., Production API Key"
                      value={ctrl.newKeyName}
                      onChange={(e) => ctrl.setNewKeyName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      {API_KEY_PERMISSION_OPTIONS.map((permission) => (
                        <div
                          key={permission.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`perm-${permission.value}`}
                            checked={ctrl.newKeyPermissions.includes(
                              permission.value,
                            )}
                            onCheckedChange={() =>
                              ctrl.handleTogglePermission(permission.value)
                            }
                          />
                          <label
                            htmlFor={`perm-${permission.value}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {permission.label}
                            <span className="text-muted-foreground ml-2">
                              - {permission.description}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires-days">
                      Expires in (days, optional)
                    </Label>
                    <Input
                      id="expires-days"
                      type="number"
                      placeholder="Leave empty for no expiration"
                      value={ctrl.newKeyExpiresDays}
                      onChange={(e) =>
                        ctrl.setNewKeyExpiresDays(e.target.value)
                      }
                    />
                  </div>

                  <Button
                    onClick={ctrl.handleCreateKey}
                    className="w-full"
                    disabled={ctrl.isCreating}
                  >
                    {ctrl.isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create API Key
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {ctrl.apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No API keys yet</p>
            <p className="text-sm">
              Create an API key to access your vaults programmatically
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ctrl.apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{key.name}</span>
                    {!key.is_active && (
                      <Badge variant="destructive">Revoked</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <code>{key.key_prefix}</code>
                    <span>•</span>
                    <span>
                      Created {format(new Date(key.created_at), "MMM d, yyyy")}
                    </span>
                    {key.expires_at && (
                      <>
                        <span>•</span>
                        <span>
                          Expires{" "}
                          {format(new Date(key.expires_at), "MMM d, yyyy")}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {key.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the API key "{key.name}".
                        Any applications using this key will stop working.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => ctrl.handleDeleteKey(key.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
