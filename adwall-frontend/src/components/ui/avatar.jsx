import { cn } from "@/lib/utils";
const Avatar = ({ src, alt, fallback, className }) => (
  <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100", className)}>
    {src ? <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-600">{fallback}</span>}
  </div>
);
export { Avatar };
