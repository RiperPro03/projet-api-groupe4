import Image from "next/image";
import { cn } from "@/lib/utils";

type ThemedLogoProps = {
  className?: string;
  size: number;
};

export function ThemedLogo({ className, size }: ThemedLogoProps) {
  const imageClassName = cn("shrink-0 object-cover", className);

  return (
    <>
      <Image
        src="/breezy-logo-light.ico"
        alt=""
        width={size}
        height={size}
        unoptimized
        className={cn(imageClassName, "dark:hidden")}
      />
      <Image
        src="/breezy-logo.ico"
        alt=""
        width={size}
        height={size}
        unoptimized
        className={cn(imageClassName, "hidden dark:block")}
      />
    </>
  );
}
