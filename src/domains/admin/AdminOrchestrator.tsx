import React from 'react';
import { AdminSystemArchitectureTab } from '@/domains/admin/components/AdminSystemArchitectureTab';
import { AdminHealthMetricsTab } from '@/domains/admin/components/AdminHealthMetricsTab';
import { AdminAuditFeedTab } from '@/domains/admin/components/AdminAuditFeedTab';
import { AdminUserManagementTab } from '@/domains/admin/components/AdminUserManagementTab';
import { useSuperadminGuard } from '@/domains/admin/shared/hooks/useSuperadminGuard';

export interface AdminOrchestratorProps {
  activeTab?: 'architecture' | 'health' | 'audit' | 'users';
}

/**
 * AdminOrchestrator: Entry point tunggal untuk domain Admin & Telemetri
 */
export const AdminOrchestrator: React.FC<AdminOrchestratorProps> = ({ activeTab = 'architecture' }) => {
  const { isSuperadmin, loading } = useSuperadminGuard();

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Checking admin privileges...</div>;
  }

  if (!isSuperadmin) {
    return <div className="p-8 text-center text-destructive">Access denied. Superadmin required.</div>;
  }

  return (
    <div className="admin-orchestrator w-full h-full p-6 space-y-6 overflow-auto">
      {activeTab === 'architecture' && <AdminSystemArchitectureTab />}
      {activeTab === 'health' && <AdminHealthMetricsTab />}
      {activeTab === 'audit' && <AdminAuditFeedTab />}
      {activeTab === 'users' && <AdminUserManagementTab />}
    </div>
  );
};

export default AdminOrchestrator;
