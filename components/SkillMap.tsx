"use client";

import type { Edge, Node, ReactFlowInstance } from "reactflow";

import dynamic from "next/dynamic";
import Papa from "papaparse";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import "reactflow/dist/style.css";

const ReactFlow = dynamic(() => import("reactflow"), { ssr: false });
const Background = dynamic(
  () => import("reactflow").then((mod) => mod.Background),
  { ssr: false }
);

interface CsvNode {
  id: string;
  label: string;
  type: "domain" | "skill";
}
interface CsvLink {
  source: string;
  target: string;
}

export default function SkillMap({
  nodesCsv = "/skills/nodes.csv",
  linksCsv = "/skills/links.csv",
}: {
  nodesCsv?: string;
  linksCsv?: string;
}) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [instance, setInstance] = useState<ReactFlowInstance | null>(null);
  const [showCrossovers, setShowCrossovers] = useState(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [container, setContainer] = useState<{ w: number; h: number }>({
    w: 1200,
    h: 560,
  });
  const [rawNodes, setRawNodes] = useState<CsvNode[]>([]);
  const [rawLinks, setRawLinks] = useState<CsvLink[]>([]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!wrapRef.current) return;
      setContainer({
        w: wrapRef.current.clientWidth,
        h: wrapRef.current.clientHeight,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);

    if (wrapRef.current) ro.observe(wrapRef.current);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const loadNodes = new Promise<CsvNode[]>((resolve) =>
      Papa.parse(nodesCsv, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data as CsvNode[]),
      })
    );
    const loadLinks = new Promise<CsvLink[]>((resolve) =>
      Papa.parse(linksCsv, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data as CsvLink[]),
      })
    );

    Promise.all([loadNodes, loadLinks]).then(([nodeData, linkData]) => {
      setRawNodes(nodeData);
      setRawLinks(linkData);
    });
  }, [nodesCsv, linksCsv]);

  useEffect(() => {
    if (rawNodes.length === 0) return;

    const nodeData = rawNodes;
    const linkData = rawLinks;

    // Build fast lookup maps
    const byId = new Map(nodeData.map((n) => [n.id, n]));
    const domains = nodeData.filter((n) => n.type === "domain");
    const skills = nodeData.filter((n) => n.type === "skill");

    // Determine home category for each skill (first domain→skill)
    const home = new Map<string, string>();

    for (const l of linkData) {
      const s = byId.get(l.source);
      const t = byId.get(l.target);

      if (!s || !t) continue;
      if (s.type === "domain" && t.type === "skill" && !home.has(t.id))
        home.set(t.id, s.id);
      if (t.type === "domain" && s.type === "skill" && !home.has(s.id))
        home.set(s.id, t.id);
    }

    // Group skills by domain; create a virtual Misc domain if needed
    const grouped: Record<string, CsvNode[]> = {};
    const miscDomainId = "__Misc__";
    const miscDomainLabel = "Miscellaneous";
    let needMisc = false;

    for (const s of skills) {
      const dom = home.get(s.id);

      if (!dom) {
        needMisc = true;
        (grouped[miscDomainId] ||= []).push(s);
      } else {
        (grouped[dom] ||= []).push(s);
      }
    }

    const domainList = needMisc
      ? [...domains, { id: miscDomainId, label: miscDomainLabel, type: "domain" as const }]
      : domains;

    // Layout constants
    const domainWidth = 300;
    const skillWidth = 260;
    const domainHeight = 84;
    const rowHeight = 84;
    const rowGap = 16;
    const colGap = 48;

    // compute columns from container width
    const maxCols = Math.max(
      1,
      Math.floor((container.w + colGap) / (domainWidth + colGap))
    );
    const rows: Array<typeof domainList> = [];

    for (let i = 0; i < domainList.length; i += maxCols) {
      rows.push(domainList.slice(i, i + maxCols));
    }

    const positions: Record<string, { x: number; y: number }> = {};
    let currentY = 0;

    rows.forEach((rowDomains) => {
      const rowWidth =
        rowDomains.length * domainWidth + (rowDomains.length - 1) * colGap;
      const startX = Math.max(0, (container.w - rowWidth) / 2);

      rowDomains.forEach((d, i) => {
        const x = startX + i * (domainWidth + colGap);
        const y = currentY;

        positions[d.id] = { x, y };

        const group = grouped[d.id] || [];

        group.forEach((s, j) => {
          const sx = x + (domainWidth - skillWidth) / 2;
          const sy = y + domainHeight + j * (rowHeight + rowGap);

          positions[s.id] = { x: sx, y: sy };
        });
      });

      const tallest = Math.max(
        ...rowDomains.map((d) => {
          const count = (grouped[d.id] || []).length;

          return domainHeight + (count > 0 ? count * (rowHeight + rowGap) - rowGap : 0);
        }),
        domainHeight
      );

      currentY += tallest + 48;
    });

    const totalHeight = Math.max(560, currentY + 24);

    setContainer((c) => ({ ...c, h: totalHeight }));

    const rfNodes: Node[] = [
      // DOMAIN nodes
      ...domainList.map((d) => ({
        id: d.id,
        position: positions[d.id] || { x: 0, y: 0 },
        data: { label: d.label },
        draggable: false,
        selectable: false,
        connectable: false,
        style: {
          width: 300,
          borderRadius: 12,
          background: "rgba(5,150,105,0.15)",
          border: "1px solid rgba(16,185,129,0.40)",
          color: "rgb(167,243,208)",
          padding: "8px 16px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          backdropFilter: "blur(2px)",
        },
      })),
      // SKILL nodes
      ...skills.map((s) => ({
        id: s.id,
        position: positions[s.id] || { x: 0, y: 0 },
        data: { label: s.label },
        draggable: false,
        selectable: true,
        connectable: false,
        style: {
          width: 260,
          borderRadius: 10,
          background: "rgba(15,23,42,0.5)",
          border: "1px solid rgba(51,65,85,0.70)",
          color: "rgb(226,232,240)",
          fontSize: 14,
          padding: "8px 12px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
        },
      })),
    ];

    const EDGE_COLOR = "rgba(148,163,184,0.9)";

    const rfEdges: Edge[] = [];

    for (let i = 0; i < linkData.length; i++) {
      const l = linkData[i];
      const s = byId.get(l.source);
      const t = byId.get(l.target);

      if (!s || !t) continue;
      const membership =
        (s.type === "domain" && t.type === "skill") ||
        (s.type === "skill" && t.type === "domain");

      if (!membership && !showCrossovers) continue;

      rfEdges.push({
        id: `e-${i}`,
        source: l.source,
        target: l.target,
        type: "smoothstep",
        animated: !membership,
        selectable: false,
        style: membership
          ? { stroke: EDGE_COLOR, strokeWidth: 1 }
          : {
              stroke: EDGE_COLOR,
              strokeWidth: 1,
              strokeDasharray: 4,
              opacity: 0.8,
            },
      });
    }

    setNodes(rfNodes);
    requestAnimationFrame(() => setEdges(rfEdges));
  }, [rawNodes, rawLinks, container, showCrossovers]);

  useEffect(() => {
    if (instance && nodes.length > 0) {
      requestAnimationFrame(() => instance.fitView({ padding: 0.25 }));
    }
  }, [instance, nodes, edges]);

  useEffect(() => {
    if (!instance) return;
    const handler = () => instance.fitView({ padding: 0.25 });

    window.addEventListener("resize", handler);

    return () => window.removeEventListener("resize", handler);
  }, [instance]);

  return (
    <section aria-label="Interconnected Skill Map">
      <div
        ref={wrapRef}
        className="w-full overflow-hidden rounded-xl border bg-[#0B1020]"
        style={{
          height: container.h,
          maskImage: "linear-gradient(to right, transparent 2%, black 13%)",
        }}
      >
        {nodes.length > 0 && (
          <ReactFlow
            fitView
            panOnScroll
            edges={edges}
            maxZoom={1.8}
            minZoom={0.8}
            nodes={nodes}
            nodesConnectable={false}
            nodesDraggable={false}
            panOnScrollSpeed={1}
            proOptions={{ hideAttribution: true }}
            onInit={setInstance}
          >
            <div className="absolute right-3 top-3 z-10 rounded-md bg-slate-900/90 px-3 py-2 text-xs text-slate-200">
              <label className="inline-flex items-center gap-2">
                <input
                  checked={showCrossovers}
                  type="checkbox"
                  onChange={(e) => setShowCrossovers(e.target.checked)}
                />
                Show crossovers
              </label>
            </div>
            <Background
              color="#334155"
              gap={16}
              size={1}
              style={{ opacity: 0.5 }}
              variant="dots"
            />
          </ReactFlow>
        )}
      </div>
    </section>
  );
}
