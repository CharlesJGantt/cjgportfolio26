"use client";

import dynamic from "next/dynamic";
import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";

// react-force-graph must be client-only
const ForceGraph2D = dynamic(
  () => import("react-force-graph").then(m => m.ForceGraph2D),
  { ssr: false }
);

type Node = { id: string; label: string; type: "domain" | "skill"; fx?: number; fy?: number; degree?: number };
type Link = { source: string; target: string };

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;

  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export default function SkillMap({
  nodesCsv = "/skills/nodes.csv",
  linksCsv = "/skills/links.csv",
  dark = true
}: { nodesCsv?: string; linksCsv?: string; dark?: boolean }) {
  const fgRef = useRef<any>(null);
  const [data, setData] = useState<{ nodes: Node[]; links: Link[] } | null>(null);

  useEffect(() => {
    const loadNodes = new Promise<Node[]>((resolve) =>
      Papa.parse(nodesCsv, { download: true, header: true, skipEmptyLines: true,
        complete: (res) => resolve((res.data as Node[]).map(n => ({ ...n, type: n.type as any }))) })
    );
    const loadLinks = new Promise<Link[]>((resolve) =>
      Papa.parse(linksCsv, { download: true, header: true, skipEmptyLines: true,
        complete: (res) => resolve(res.data as Link[]) })
    );

    Promise.all([loadNodes, loadLinks]).then(([nodes, links]) => {
      // degree map (optional: affects label sizing if you want)
      const deg = new Map<string, number>();

      links.forEach(l => {
        deg.set(l.source, (deg.get(l.source) || 0) + 1);
        deg.set(l.target, (deg.get(l.target) || 0) + 1);
      });
      nodes.forEach(n => (n.degree = deg.get(n.id) || 0));

      // deterministic layout (no force jiggle)
      const W = 1200, H = 720, cx = W / 2, cy = H / 2;
      const domains = nodes.filter(n => n.type === "domain");
      const skills = nodes.filter(n => n.type === "skill");

      // domains around a ring
      const step = 360 / domains.length;

      domains.forEach((d, i) => {
        const { x, y } = polar(cx, cy, 220, i * step - 90);

        d.fx = x; d.fy = y;
      });

      // map skill → home domain (first domain link found)
      const home = new Map<string, string>();

      links.forEach(l => {
        const s = nodes.find(n => n.id === l.source);
        const t = nodes.find(n => n.id === l.target);

        if (s && t) {
          if (s.type === "domain" && t.type === "skill") home.set(t.id, s.id);
          if (t.type === "domain" && s.type === "skill") home.set(s.id, t.id);
        }
      });

      // orbit skills around their home domain (two rings for spacing)
      const grouped: Record<string, Node[]> = {};

      skills.forEach(s => {
        const key = home.get(s.id) || domains[0].id;

        grouped[key] = grouped[key] || [];
        grouped[key].push(s);
      });
      Object.entries(grouped).forEach(([domId, arr]) => {
        const d = domains.find(x => x.id === domId)!;
        const r1 = 95, r2 = 145;

        arr.forEach((s, i) => {
          const r = i % 2 === 0 ? r1 : r2;
          const angle = (360 / arr.length) * i;
          const { x, y } = polar(d.fx!, d.fy!, r, angle);

          s.fx = x; s.fy = y;
        });
      });

      setData({ nodes, links });
    });
  }, [nodesCsv, linksCsv]);

  const colors = {
    bg: dark ? "#0B1020" : "#FFFFFF",
    text: dark ? "#E5E7EB" : "#111827",
    domain: "#4F46E5", // indigo-600
    skill: "#10B981",  // emerald-500
    link: dark ? "#334155" : "#CBD5E1"
  };

  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D) => {
    const r = node.type === "domain" ? 12 : 8;

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = node.type === "domain" ? colors.domain : colors.skill;
    ctx.fill();

    const label = node.label || node.id;
    const size = Math.max(10, node.type === "domain" ? 14 : 11);

    ctx.font = `${size}px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
    ctx.fillStyle = colors.text;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(label, node.x + r + 6, node.y);
  };

  if (!data) {
    return <div className="h-[560px] w-full rounded-2xl border border-slate-700" style={{ background: colors.bg }} />;
  }

  return (
    <div className="relative w-full h-[560px] rounded-2xl border border-slate-700" style={{ background: colors.bg }}>
      <ForceGraph2D
        ref={fgRef}
        enablePanInteraction
        enableZoomInteraction
        backgroundColor={colors.bg}
        cooldownTime={0}         // fixed positions; no force animation
        graphData={data}
        linkColor={() => colors.link}
        nodeCanvasObject={nodeCanvasObject}
        nodeRelSize={1}
      />
      {/* Legend */}
      <div
        className="absolute right-3 top-3 rounded-md px-3 py-2 text-sm shadow"
        style={{ background: dark ? "rgba(31,41,55,0.9)" : "rgba(255,255,255,0.95)", color: colors.text }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: colors.domain }} /> Domains
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: colors.skill }} /> Skills
        </div>
      </div>
    </div>
  );
}
