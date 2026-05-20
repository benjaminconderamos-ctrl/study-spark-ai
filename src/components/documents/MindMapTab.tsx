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

// Vibrant pastel palette — one color per branch, children share the family.
// Inspired by hand-drawn colorful mind maps.
const BRANCH_PALETTE = [
  { bg: "#F8B4C8", border: "#E879A4", text: "#4A1828" }, // rosa
  { bg: "#FFE08A", border: "#E8B520", text: "#4A3A00" }, // amarillo
  { bg: "#A8E6A3", border: "#5FB857", text: "#1A3D17" }, // verde
  { bg: "#A8D8F0", border: "#5FAEDB", text: "#0F2E47" }, // azul
  { bg: "#FFC48A", border: "#E88C1F", text: "#4A2800" }, // naranja
  { bg: "#D4B4F0", border: "#9F6FD8", text: "#2E1547" }, // morado
  { bg: "#A8E8DD", border: "#4FBFAE", text: "#0F3D37" }, // turquesa
  { bg: "#F0A8A8", border: "#D85F5F", text: "#4A1717" }, // coral
] as const;

const CENTRAL_STYLE: React.CSSProperties = {
  background: "#1F2937",
  color: "#FFFFFF",
  border: "3px solid #111827",
  borderRadius: 16,
  padding: "18px 28px",
  minWidth: 180,
  maxWidth: 260,
  fontWeight: 800,
  fontSize: 18,
  letterSpacing: "0.02em",
  textTransform: "uppercase" as const,
  textAlign: "center" as const,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  lineHeight: 1.2,
};

function branchStyle(idx: number): React.CSSProperties {
  const c = BRANCH_PALETTE[idx % BRANCH_PALETTE.length];
  return {
    background: c.bg,
    color: c.text,
    border: `2px solid ${c.border}`,
    borderRadius: 12,
    padding: "12px 18px",
    minWidth: 130,
    maxWidth: 200,
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center" as const,
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    lineHeight: 1.25,
  };
}

function childStyle(idx: number): React.CSSProperties {
  const c = BRANCH_PALETTE[idx % BRANCH_PALETTE.length];
  // Lighter tint for children
  return {
    background: `${c.bg}CC`,
    color: c.text,
    border: `1.5px solid ${c.border}`,
    borderRadius: 10,
    padding: "8px 14px",
    minWidth: 100,
    maxWidth: 170,
    fontSize: 12,
    fontWeight: 500,
    textAlign: "center" as const,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    lineHeight: 1.2,
  };
}

function edgeStyleForBranch(idx: number) {
  const c = BRANCH_PALETTE[idx % BRANCH_PALETTE.length];
  return { stroke: c.border, strokeWidth: 2 };
}

/**
 * Radial layout: central node at origin, branches arranged on a circle,
 * children placed in a small arc just outside their branch (pointing away
 * from center). On mobile we use a more compact vertical-radial layout.
 */
function buildGraph(mindmap: MindMap, mobile: boolean): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const branchRadius = mobile ? 220 : 320;
  const childRadius = mobile ? 360 : 540;
  const childArc = mobile ? 0.55 : 0.75; // radians of spread for children

  nodes.push({
    id: "root",
    data: { label: mindmap.central },
    position: { x: 0, y: 0 },
    style: CENTRAL_STYLE,
    draggable: true,
  });

  const n = mindmap.branches.length;
  mindmap.branches.forEach((branch, bi) => {
    // Distribute branches evenly on a circle, starting at the top
    const angle = -Math.PI / 2 + (2 * Math.PI * bi) / n;
    const bx = Math.cos(angle) * branchRadius;
    const by = Math.sin(angle) * branchRadius;
    const branchId = `b-${bi}`;
    nodes.push({
      id: branchId,
      data: { label: branch.title },
      position: { x: bx, y: by },
      style: branchStyle(bi),
      draggable: true,
    });
    edges.push({
      id: `e-root-${branchId}`,
      source: "root",
      target: branchId,
      type: "straight",
      style: edgeStyleForBranch(bi),
      animated: false,
    });

    const m = branch.children.length;
    branch.children.forEach((child, ci) => {
      // Children fan out in an arc centered on the branch's angle
      const spread = m === 1 ? 0 : (ci - (m - 1) / 2) * (childArc / Math.max(1, m - 1));
      const cAngle = angle + spread;
      const cx = Math.cos(cAngle) * childRadius;
      const cy = Math.sin(cAngle) * childRadius;
      const childId = `c-${bi}-${ci}`;
      nodes.push({
        id: childId,
        data: { label: child },
        position: { x: cx, y: cy },
        style: childStyle(bi),
        draggable: true,
      });
      edges.push({
        id: `e-${branchId}-${childId}`,
        source: branchId,
        target: childId,
        type: "straight",
        style: edgeStyleForBranch(bi),
      });
    });
  });

  return { nodes, edges };
}

function MindMapCanvas({ mindmap, title }: { mindmap: MindMap; title?: string }) {
  const isMobile = useIsMobile();
  const initial = useMemo(() => buildGraph(mindmap, isMobile), [mindmap, isMobile]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initial.edges);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNodes(initial.nodes);
  }, [initial.nodes, setNodes]);

  const handleDownload = useCallback(async () => {
    const host = wrapperRef.current?.querySelector(".react-flow") as HTMLElement | null;
    if (!host) return;
    try {
      const dataUrl = await toPng(host, {
        backgroundColor: "#FFFFFF",
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
    <div
      className="relative w-full h-[70vh] min-h-[500px] border border-border rounded-lg overflow-hidden"
      style={{ background: "#FAFAF7" }}
    >
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
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="#E5E5E0" />
          <Controls showInteractive={false} />
          {!isMobile && <MiniMap pannable zoomable className="!bg-white !border-border" />}
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
          Visualize the main topic, themes, and key concepts as a colorful radial mind map you can drag and rearrange.
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
