import React from "react";

export interface CommunityOrchestratorProps {
  username?: string;
  vaultSlug?: string;
  noteSlug?: string;
  mode?: "reader" | "explore";
  children?: React.ReactNode;
}

/**
 * CommunityOrchestrator: Entry point domain untuk portal pembaca publik (/:username, /@:username)
 * serta penjelajahan komunitas pengetahuan (/explore).
 */
export const CommunityOrchestrator: React.FC<CommunityOrchestratorProps> = ({
  children,
}) => {
  return (
    <div className="community-orchestrator flex w-full h-screen overflow-hidden bg-background">
      {children}
    </div>
  );
};

export const PublicReaderOrchestrator = CommunityOrchestrator;
export default CommunityOrchestrator;
