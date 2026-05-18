import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, RefreshCw, Download, Network } from "lucide-react";
import { toast } from "sonner";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { generateMindMap } from "@/lib/mindmap.functions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEntitlements } from "@/hooks/use-entitlements";
import { UpgradeProDialog } from "@/components/UpgradeProDialog";
import type { MindMap } from "@/lib/ai/services/mindmap.service";

type Props = { documentId: string; ready: boolean; title?: string };

// Minimalist palette: neutral cards, single accent per level (left bar + dot).
const LEVEL_ACCENT = {
  0: "hsl(217 91% 60%)", // blue
  1: "hsl(270 70% 60%)", // purple
  2: "hsl(243 75% 65%)", // indigo
} as const;

function nodeLabel(level: 0 | 1 | 2, label: string) {
  const accent = LEVEL_ACCENT[level];
  const fontSize = level === 0 ? 15 : level === 1 ? 13 : 12;
  const fontWeight = level === 0 ? 600 : level === 1 ? 500 : 400;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize,
        fontWeight,
        lineHeight: 1.25,
        letterSpacing: level === 0 ? "-0.01em" : 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: accent,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function nodeStyle(level: 0 | 1 | 2): React.CSSProperties {
  const accent = LEVEL_ACCENT[level];
  const padX = level === 0 ? 18 : level === 1 ? 14 : 12;
  const padY = level === 0 ? 12 : level === 1 ? 9 : 7;
  const minWidth = level === 0 ? 180 : level === 1 ? 150 : 130;
  const maxWidth = level === 0 ? 260 : level === 1 ? 220 : 200;
  return {
    background: "hsl(var(--card))",
    color: "hsl(var(--card-foreground))",
    border: "1px solid hsl(var(--border))",
    borderLeft: `3px solid ${accent}`,
    borderRadius: 8,
    padding: `${padY}px ${padX}px`,
    minWidth,
    maxWidth,
    boxShadow: "0 1px 2px hsl(0 0% 0% / 0.04)",
    textAlign: "left",
  };
}

const EDGE_STYLE = {
  stroke: "hsl(var(--border))",
  strokeWidth: 1,
} as const;

function buildGraph(mindmap: MindMap, layout: "horizontal" | "vertical"): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (layout === "vertical") {
    // ---- Mobile: top-down columns of children under each branch ----
    const ROOT_Y = 0;
    const BRANCH_Y_GAP = 200;
    const CHILD_X_GAP = 170;
    const CHILD_Y = 110;

    nodes.push({
      id: "root",
      data: { label: nodeLabel(0, mindmap.central) },
      position: { x: 0, y: ROOT_Y },
      style: nodeStyle(0),
      sourcePosition: "bottom" as never,
      targetPosition: "top" as never,
    });

    mindmap.branches.forEach((branch, bi) => {
      const branchY = ROOT_Y + 140 + bi * BRANCH_Y_GAP;
      const branchId = `b-${bi}`;
      nodes.push({
        id: branchId,
        data: { label: nodeLabel(1, branch.title) },
        position: { x: 0, y: branchY },
        style: nodeStyle(1),
        sourcePosition: "bottom" as never,
        targetPosition: "top" as never,
      });
      edges.push({
        id: `e-root-${branchId}`,
        source: "root",
        target: branchId,
        type: "smoothstep",
        style: EDGE_STYLE,
      });

      const n = branch.children.length;
      branch.children.forEach((child, ci) => {
        const offsetX = (ci - (n - 1) / 2) * CHILD_X_GAP;
        const childId = `c-${bi}-${ci}`;
        nodes.push({
          id: childId,
          data: { label: nodeLabel(2, child) },
          position: { x: offsetX, y: branchY + CHILD_Y },
          style: nodeStyle(2),
          sourcePosition: "bottom" as never,
          targetPosition: "top" as never,
        });
        edges.push({
          id: `e-${branchId}-${childId}`,
          source: branchId,
          target: childId,
          type: "smoothstep",
          style: EDGE_STYLE,
        });
      });
    });
  } else {
    // ---- Desktop: balanced symmetric tree, branches on left and right of root ----
    // Each branch gets a vertical slot sized by its children, then children stack
    // vertically next to the branch. Left / right alternation keeps it organized.
    const ROW_HEIGHT = 56; // vertical space per child row
    const BRANCH_GAP = 36; // padding between branches
    const ROOT_X_OFFSET = 280; // distance root -> branch
    const CHILD_X_OFFSET = 240; // distance branch -> child

    const splitIndex = Math.ceil(mindmap.branches.length / 2);
    const leftBranches = mindmap.branches.slice(0, splitIndex);
    const rightBranches = mindmap.branches.slice(splitIndex);

    const slotHeight = (b: MindMap["branches"][number]) =>
      Math.max(1, b.children.length) * ROW_HEIGHT + BRANCH_GAP;

    const layoutSide = (
      side: "left" | "right",
      branches: MindMap["branches"],
      startBi: number,
    ) => {
      const totalH = branches.reduce((sum, b) => sum + slotHeight(b), 0);
      let cursorY = -totalH / 2;
      const sign = side === "left" ? -1 : 1;
      const branchX = sign * ROOT_X_OFFSET;
      const childX = sign * (ROOT_X_OFFSET + CHILD_X_OFFSET);

      branches.forEach((branch, idx) => {
        const bi = startBi + idx;
        const h = slotHeight(branch);
        const branchCenterY = cursorY + h / 2;
        const branchId = `b-${bi}`;
        nodes.push({
          id: branchId,
          data: { label: nodeLabel(1, branch.title) },
          position: { x: branchX, y: branchCenterY },
          style: nodeStyle(1),
          sourcePosition: side === "left" ? ("left" as never) : ("right" as never),
          targetPosition: side === "left" ? ("right" as never) : ("left" as never),
        });
        edges.push({
          id: `e-root-${branchId}`,
          source: "root",
          target: branchId,
          type: "smoothstep",
          style: EDGE_STYLE,
        });

        const n = branch.children.length;
        const childrenTotalH = n * ROW_HEIGHT;
        branch.children.forEach((child, ci) => {
          const childY = branchCenterY - childrenTotalH / 2 + ci * ROW_HEIGHT + ROW_HEIGHT / 2;
          const childId = `c-${bi}-${ci}`;
          nodes.push({
            id: childId,
            data: { label: nodeLabel(2, child) },
            position: { x: childX, y: childY },
            style: nodeStyle(2),
            sourcePosition: side === "left" ? ("left" as never) : ("right" as never),
            targetPosition: side === "left" ? ("right" as never) : ("left" as never),
          });
          edges.push({
            id: `e-${branchId}-${childId}`,
            source: branchId,
            target: childId,
            type: "smoothstep",
            style: EDGE_STYLE,
          });
        });

        cursorY += h;
      });
    };

    nodes.push({
      id: "root",
      data: { label: nodeLabel(0, mindmap.central) },
      position: { x: 0, y: 0 },
      style: nodeStyle(0),
    });

    layoutSide("left", leftBranches, 0);
    layoutSide("right", rightBranches, leftBranches.length);
  }

  return { nodes, edges };
}

function MindMapCanvas({ mindmap, title }: { mindmap: MindMap; title?: string }) {
  const isMobile = useIsMobile();
  const layout: "horizontal" | "vertical" = isMobile ? "vertical" : "horizontal";

  const initial = useMemo(() => buildGraph(mindmap, layout), [mindmap, layout]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initial.edges);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Rebuild when layout changes (mobile <-> desktop)
  useEffect(() => {
    setNodes(initial.nodes);
  }, [initial.nodes, setNodes]);

  const handleDownload = useCallback(async () => {
    const el = wrapperRef.current?.querySelector(".react-flow__viewport") as HTMLElement | null;
    const host = wrapperRef.current?.querySelector(".react-flow") as HTMLElement | null;
    const target = host ?? el;
    if (!target) return;
    try {
      const dataUrl = await toPng(target, {
        backgroundColor: getComputedStyle(document.documentElement)
          .getPropertyValue("--background")
          ? `oklch(${getComputedStyle(document.documentElement).getPropertyValue("--background")})`
          : "#ffffff",
        pixelRatio: 2,
        filter: (node) => {
          const cls = (node as HTMLElement).classList;
          if (!cls) return true;
          return !cls.contains("react-flow__minimap") && !cls.contains("react-flow__controls");
        },
      });
      const link = document.createElement("a");
      link.download = `${(title ?? "mindmap").replace(/[^a-z0-9-_]+/gi, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Could not export image.");
    }
  }, [title]);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] border border-border rounded-lg overflow-hidden bg-muted/20">
      <div className="absolute top-3 right-3 z-10">
        <Button size="sm" variant="secondary" onClick={handleDownload} className="shadow-md">
          <Download className="h-4 w-4 mr-1" />
          PNG
        </Button>
      </div>
      <div ref={wrapperRef} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="hsl(var(--border) / 0.5)" />
          <Controls showInteractive={false} />
          {!isMobile && <MiniMap pannable zoomable className="!bg-background !border-border" />}
        </ReactFlow>
      </div>
    </div>
  );
}

export function MindMapTab({ documentId, ready, title }: Props) {
  const run = useServerFn(generateMindMap);
  const [mindmap, setMindmap] = useState<MindMap | null>(null);
  const { data: ent } = useEntitlements();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await run({ data: { documentId } });
      return res.mindmap as MindMap;
    },
    onSuccess: (data) => {
      setMindmap(data);
      toast.success("Mind map ready.");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to generate mind map");
    },
  });

  if (ent && !ent.mindMapAllowed) {
    return (
      <>
        <div className="border border-dashed border-border rounded-lg py-16 text-center px-6">
          <Network className="h-6 w-6 mx-auto text-muted-foreground mb-3" strokeWidth={1.25} />
          <p className="font-serif text-2xl text-foreground">Mind maps are a Max feature</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Upgrade to StudyFlow Max to generate automatic mind maps from your documents — plus exports, study plans and priority processing.
          </p>
          <Button className="mt-6" onClick={() => setUpgradeOpen(true)}>
            Upgrade to Max
          </Button>
        </div>
        <UpgradeProDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} priceId="max_monthly" />
      </>
    );
  }

  if (!ready) {
    return (
      <div className="border border-dashed border-border rounded-lg py-16 text-center">
        <p className="font-serif text-2xl text-foreground">Mind Map</p>
        <p className="text-sm text-muted-foreground mt-2">
          Available once the document finishes processing.
        </p>
      </div>
    );
  }

  if (!mindmap) {
    return (
      <div className="border border-dashed border-border rounded-lg py-16 text-center">
        <Network className="h-6 w-6 mx-auto text-muted-foreground mb-3" strokeWidth={1.25} />
        <p className="font-serif text-2xl text-foreground">No mind map yet</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Visualize the main topic, themes, and key concepts as an interactive map you can drag and rearrange.
        </p>
        <Button className="mt-5" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate mind map
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {mindmap.branches.length} themes · {mindmap.branches.reduce((n, b) => n + b.children.length, 0)} concepts
        </p>
        <Button variant="outline" size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Regenerate
        </Button>
      </div>
      <ReactFlowProvider>
        <MindMapCanvas mindmap={mindmap} title={title} />
      </ReactFlowProvider>
    </div>
  );
}
