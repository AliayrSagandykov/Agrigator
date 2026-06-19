import Image from "next/image";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({
  name,
  photo,
  color,
  size = 44,
  className,
}: {
  name: string;
  photo?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  if (photo) {
    return (
      <Image
        src={photo}
        alt={name}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        unoptimized
      />
    );
  }
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, backgroundColor: color || "#7c3aed", fontSize: size * 0.4 }}
    >
      {initials(name)}
    </div>
  );
}
