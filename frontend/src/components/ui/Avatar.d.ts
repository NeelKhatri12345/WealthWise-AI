interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}
export declare function Avatar({
  src,
  alt,
  name,
  size,
  className,
}: AvatarProps): import("react").JSX.Element;
export {};
