import React from 'react';
import { useEffect, useState } from 'react';
import { SystemArchitectureTab } from '@/domains/admin/components/AdminSystemArchitectureTab';
import { HealthMetricsTab } from '@/domains/admin/components/AdminHealthMetricsTab';
import { AuditFeedTab } from '@/domains/admin/components/AdminAuditFeedTab';
import { UserManagementTab } from '@/domains/admin/components/AdminUserManagementTab';
import { useSuperadminGuard } from '@/domains/admin/shared/hooks/useSuperadminGuard';
import { AdminService } from '@/domains/admin/shared/api/AdminService';
import type { AuditLogRecord } from '@/types/collaboration';
import type { SystemMetrics, SystemTelemetryContract, UserWithRole } from '@/types/admin';

export interface AdminOrchestratorProps {
  activeTab?: 'architecture' | 'health' | 'audit' | 'users';
}

/**
 * AdminOrchestrator: Entry point tunggal untuk domain Admin & Telemetri
 */
export const AdminOrchestrator: React.FC<AdminOrchestratorProps> = ({ activeTab = 'architecture' }) => {
  const { isAuthorized, loading } = useSuperadminGuard();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [telemetry] = useState<SystemTelemetryContract>(() => AdminService.getSystemTelemetry());
  const refreshUsers = React.useCallback(() => {
    void AdminService.getUsersWithRoles().then(setUsers);
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    void AdminService.getSystemMetrics().then(setMetrics);
    void AdminService.getAuditLogs().then(setAuditLogs);
    refreshUsers();
  }, [isAuthorized, refreshUsers]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Checking admin privileges...</div>;
  }

  if (!isAuthorized) {
    return <div className="p-8 text-center text-destructive">Access denied. Superadmin required.</div>;
  }

  return (
    <div className="admin-orchestrator w-full h-full p-6 space-y-6 overflow-auto">
      {activeTab === 'architecture' && <SystemArchitectureTab telemetry={telemetry} />}
      {activeTab === 'health' && <HealthMetricsTab metrics={metrics} auditLogs={auditLogs} />}
      {activeTab === 'audit' && <AuditFeedTab auditLogs={auditLogs} />}
      {activeTab === 'users' && <UserManagementTab users={users} onRefresh={refreshUsers} />}
    </div>
  );
};

export default AdminOrchestrator;
