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

function buildGraph(mindmap: MindMap, layout: "radial" | "vertical"): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (layout === "vertical") {
    // Top-down layout for mobile
    const centerX = 0;
    nodes.push({
      id: "root",
      data: { label: mindmap.central },
      position: { x: centerX, y: 0 },
      style: LEVEL_STYLES[0],
      sourcePosition: "bottom" as never,
      targetPosition: "top" as never,
    });

    const branchSpacingY = 220;
    const childSpacingY = 70;
    let cursorY = 160;

    mindmap.branches.forEach((branch, bi) => {
      const branchId = `b-${bi}`;
      const branchY = cursorY;
      nodes.push({
        id: branchId,
        data: { label: branch.title },
        position: { x: centerX, y: branchY },
        style: LEVEL_STYLES[1],
        sourcePosition: "bottom" as never,
        targetPosition: "top" as never,
      });
      edges.push({
        id: `e-root-${branchId}`,
        source: "root",
        target: branchId,
        type: "smoothstep",
        style: { stroke: "hsl(270 70% 60%)", strokeWidth: 2 },
      });

      branch.children.forEach((child, ci) => {
        const childId = `c-${bi}-${ci}`;
        const offsetX = (ci - (branch.children.length - 1) / 2) * 180;
        nodes.push({
          id: childId,
          data: { label: child },
          position: { x: centerX + offsetX, y: branchY + 110 },
          style: LEVEL_STYLES[2],
          sourcePosition: "bottom" as never,
          targetPosition: "top" as never,
        });
        edges.push({
          id: `e-${branchId}-${childId}`,
          source: branchId,
          target: childId,
          type: "smoothstep",
          style: { stroke: "hsl(243 75% 65%)", strokeWidth: 1.5 },
        });
      });

      cursorY += branchSpacingY + Math.max(0, childSpacingY);
    });
  } else {
    // Radial layout
    nodes.push({
      id: "root",
      data: { label: mindmap.central },
      position: { x: 0, y: 0 },
      style: LEVEL_STYLES[0],
    });

    const branchRadius = 320;
    const childRadius = 200;
    const branchCount = mindmap.branches.length;

    mindmap.branches.forEach((branch, bi) => {
      const angle = (bi / branchCount) * Math.PI * 2 - Math.PI / 2;
      const bx = Math.cos(angle) * branchRadius;
      const by = Math.sin(angle) * branchRadius;
      const branchId = `b-${bi}`;
      nodes.push({
        id: branchId,
        data: { label: branch.title },
        position: { x: bx, y: by },
        style: LEVEL_STYLES[1],
      });
      edges.push({
        id: `e-root-${branchId}`,
        source: "root",
        target: branchId,
        type: "smoothstep",
        style: { stroke: "hsl(270 70% 60%)", strokeWidth: 2 },
      });

      const childCount = branch.children.length;
      const spread = Math.PI / 3;
      branch.children.forEach((child, ci) => {
        const childAngle =
          angle + (childCount === 1 ? 0 : ((ci / (childCount - 1)) - 0.5) * spread);
        const cx = bx + Math.cos(childAngle) * childRadius;
        const cy = by + Math.sin(childAngle) * childRadius;
        const childId = `c-${bi}-${ci}`;
        nodes.push({
          id: childId,
          data: { label: child },
          position: { x: cx, y: cy },
          style: LEVEL_STYLES[2],
        });
        edges.push({
          id: `e-${branchId}-${childId}`,
          source: branchId,
          target: childId,
          type: "smoothstep",
          style: { stroke: "hsl(243 75% 65%)", strokeWidth: 1.5 },
        });
      });
    });
  }

  return { nodes, edges };
}

function MindMapCanvas({ mindmap, title }: { mindmap: MindMap; title?: string }) {
  const isMobile = useIsMobile();
  const layout = isMobile ? "vertical" : "radial";

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
