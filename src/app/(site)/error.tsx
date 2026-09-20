"use client";

import {
  ErrorContent,
  type ErrorContentProps,
} from "@/components/error-content";

export default function SiteError(props: ErrorContentProps) {
  return <ErrorContent {...props} />;
}
