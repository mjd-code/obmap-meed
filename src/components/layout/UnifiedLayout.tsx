import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import { RibbonTool } from "./IconRibbon";
import { WorkspaceTab, PaneType } from "./WorkspaceTabs";

interface Node {
  id: string;
  name: string;
  content: string;
  type: "folder" | "file" | "media";
  parentId: string | null;
  depth: number;
  tags: string[];
  mediaType?: "image" | "audio" | "video";
}

interface UnifiedLayoutProps {
  children: React.ReactNode;
  nodes: Node[];
  selectedNode: Node | null;
  onNodeSelect: (node: Node) => void;
  onNodeMove?: (nodeId: string, newParentId: string | null) => void;
  onAddNode?: (type: "folder" | "file") => void;
  isVaultMode: boolean;
  vaultName: string | null;
  vaultType?: "in-memory" | "local-folder";
  onCloseVault: () => void;
  graphConfigTrigger: React.ReactNode;
  onImportComplete?: (importedNodes: Node[], updatedNodes?: Node[]) => void;
  graphContent?: React.ReactNode;
  editorContent?: React.ReactNode;
  renderEditorForNode?: (node: Node) => React.ReactNode;
}

export function UnifiedLayout({
  children,
  nodes,
  selectedNode,
  onNodeSelect,
  onNodeMove,
  onAddNode,
  isVaultMode,
  vaultName,
  vaultType,
  onCloseVault,
  graphConfigTrigger,
  onImportComplete,
  graphContent,
  editorContent,
  renderEditorForNode,
}: UnifiedLayoutProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTool, setActiveTool] = useState<RibbonTool | null>("files");
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
    { id: "graph-main", type: "graph", title: "Network Graph" },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("graph-main");

  // Build node path helper
  const getNodePath = useCallback((nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return "";
    
    const pathParts: string[] = [node.name];
    let current = node;
    
    while (current.parentId) {
      const parent = nodes.find(n => n.id === current.parentId);
      if (parent) {
        pathParts.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    
    return pathParts.join(" / ");
  }, [nodes]);

  // Update tab titles when node names change
  useEffect(() => {
    setTabs(prev => prev.map(tab => {
      if (tab.type === "editor" && tab.nodeId) {
        const node = nodes.find(n => n.id === tab.nodeId);
        if (node && tab.title !== node.name) {
          return { ...tab, title: node.name };
        }
      }
      return tab;
    }));
  }, [nodes]);

  // Open a node in editor when selected
  useEffect(() => {
    if (selectedNode && selectedNode.type !== "folder") {
      const existingTab = tabs.find((t) => t.nodeId === selectedNode.id);
      if (existingTab) {
        setActiveTabId(existingTab.id);
      } else {
        const newTab: WorkspaceTab = {
          id: `editor-${selectedNode.id}`,
          type: "editor",
          title: selectedNode.name,
          nodeId: selectedNode.id,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
      }
    }
  }, [selectedNode?.id]);

  // When active tab changes, update selectedNode to match
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab?.type === "editor" && activeTab.nodeId) {
      const node = nodes.find(n => n.id === activeTab.nodeId);
      if (node && (!selectedNode || selectedNode.id !== node.id)) {
        onNodeSelect(node);
      }
    }
  }, [activeTabId, tabs, nodes]);

  // Get editor content for the current active tab
  const currentEditorContent = useMemo(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab || activeTab.type !== "editor" || !activeTab.nodeId) {
      return null;
    }
    
    const node = nodes.find(n => n.id === activeTab.nodeId);
    if (!node) return null;

    // If renderEditorForNode is provided, use it for the specific node
    if (renderEditorForNode) {
      return renderEditorForNode(node);
    }

    // Fallback to editorContent if the node matches selectedNode
    if (selectedNode && selectedNode.id === node.id) {
      return editorContent;
    }

    return null;
  }, [activeTabId, tabs, nodes, selectedNode, editorContent, renderEditorForNode]);

  // Get the node path for the active tab
  const activeNodePath = useMemo(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab?.type === "editor" && activeTab.nodeId) {
      return getNodePath(activeTab.nodeId);
    }
    return null;
  }, [activeTabId, tabs, getNodePath]);

  const handleToolSelect = useCallback((tool: RibbonTool) => {
    if (tool === "vaults") {
      navigate("/vaults");
      return;
    }
    if (tool === "account") {
      navigate("/vaults");
      return;
    }
    setActiveTool((prev) => (prev === tool ? null : tool));
  }, [navigate]);

  const handlePanelClose = useCallback(() => {
    setActiveTool(null);
  }, []);

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleTabClose = useCallback((tabId: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  const handleNewTab = useCallback((type: PaneType) => {
    const newTab: WorkspaceTab = {
      id: `${type}-${Date.now()}`,
      type,
      title: type === "graph" ? "New Graph" : "New Note",
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case "new-note":
        handleNewTab("editor");
        break;
      case "open-vault":
        navigate("/vaults");
        break;
      case "explore-graph":
        const graphTab = tabs.find((t) => t.type === "graph");
        if (graphTab) {
          setActiveTabId(graphTab.id);
        } else {
          handleNewTab("graph");
        }
        break;
      case "import-files":
        setActiveTool("import-export");
        break;
    }
  }, [navigate, tabs, handleNewTab]);

  const commonProps = {
    nodes,
    selectedNode,
    onNodeSelect,
    onNodeMove,
    onAddNode,
    isVaultMode,
    vaultName,
    vaultType,
    onCloseVault,
    graphConfigTrigger,
    onImportComplete,
    graphContent,
    editorContent: currentEditorContent,
    activeNodePath,
    children,
    activeTool,
    onToolSelect: handleToolSelect,
    tabs,
    activeTabId,
    onTabSelect: handleTabSelect,
    onTabClose: handleTabClose,
    onTabReorder: setTabs,
    onNewTab: handleNewTab,
    onQuickAction: handleQuickAction,
  };

  if (isMobile) {
    return <MobileLayout {...commonProps} />;
  }

  return <DesktopLayout {...commonProps} onPanelClose={handlePanelClose} />;
}
