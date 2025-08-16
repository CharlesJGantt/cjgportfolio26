"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type StarLayerProps = React.HTMLAttributes<HTMLDivElement> & {
  count: number;
  size: number;
  starColor: string;
};

function generateStars(count: number, starColor: string) {
  const shadows: string[] = [];

  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 4000) - 2000;
    const y = Math.floor(Math.random() * 4000) - 2000;

    shadows.push(`${x}px ${y}px ${starColor}`);
  }

  return shadows.join(", ");
}

function StarLayer({
  count = 100,
  size = 1,
  starColor = "#fff",
  className,
  ...props
}: StarLayerProps) {
  const [boxShadow, setBoxShadow] = React.useState<string>("");

  React.useEffect(() => {
    setBoxShadow(generateStars(count, starColor));
  }, [count, starColor]);

  return (
    <div
      className={cn("absolute inset-0", className)}
      data-slot="star-layer"
      {...props}
    >
      <div
        className="absolute bg-transparent rounded-full"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: boxShadow,
        }}
      />
    </div>
  );
}
type StarsBackgroundBaseProps = React.ComponentProps<"div"> & {
  factor?: number;
  starColor?: string;
  pointerEvents?: boolean;
};

type StarsBackgroundProps = StarsBackgroundBaseProps & {
  dynamic?: boolean;
};

function StaticStarsBackground({
  children,
  className,
  starColor = "#fff",
  pointerEvents = true,
  ...props
}: StarsBackgroundBaseProps) {
  return (
    <div
      className={cn(
        "relative size-full overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_#262626_0%,_#000_100%)]",
        className,
      )}
      data-slot="stars-background"
      {...props}
    >
      <div
        className={cn({ "pointer-events-none": !pointerEvents })}
        style={{ transform: "none" }}
      >
        <StarLayer count={100} size={1} starColor={starColor} />
        <StarLayer count={40} size={2} starColor={starColor} />
        <StarLayer count={20} size={3} starColor={starColor} />
      </div>
      {children}
    </div>
  );
}

function DynamicStarsBackground({
  children,
  className,
  factor = 0.05,
  starColor = "#fff",
  pointerEvents = true,
  ...props
}: StarsBackgroundBaseProps) {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const newOffsetX = -(e.clientX - centerX) * factor;
      const newOffsetY = -(e.clientY - centerY) * factor;

      setOffset({ x: newOffsetX, y: newOffsetY });
    },
    [factor],
  );

  return (
    <div
      className={cn(
        "relative size-full overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_#262626_0%,_#000_100%)]",
        className,
      )}
      data-slot="stars-background"
      onMouseMove={handleMouseMove}
      {...props}
    >
      <div
        className={cn({ "pointer-events-none": !pointerEvents })}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        <StarLayer count={100} size={1} starColor={starColor} />
        <StarLayer count={40} size={2} starColor={starColor} />
        <StarLayer count={20} size={3} starColor={starColor} />
      </div>
      {children}
    </div>
  );
}

function StarsBackground({ dynamic = false, ...props }: StarsBackgroundProps) {
  return dynamic ? (
    <DynamicStarsBackground {...props} />
  ) : (
    <StaticStarsBackground {...props} />
  );
}

export {
  StarLayer,
  StarsBackground,
  type StarLayerProps,
  type StarsBackgroundProps,
};