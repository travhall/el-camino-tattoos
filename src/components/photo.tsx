"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { PhotoPlaceholder } from "@/components/photo-placeholder";

/**
 * next/image that falls back to a placeholder when the file fails to load.
 * onError covers failures after hydration; the ref callback covers an image
 * that already failed in the server-rendered HTML, before React attached
 * onError (the error event has fired and won't fire again).
 */
export function Photo({ alt, ...props }: ImageProps & { alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <PhotoPlaceholder label={alt} />;

  return (
    <Image
      {...props}
      alt={alt}
      onError={() => setFailed(true)}
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailed(true);
      }}
    />
  );
}
