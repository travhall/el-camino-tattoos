import type { IconName } from "@/components/ui/icon";

/**
 * Social profiles the shop links to, edited in Keystatic (Shop info →
 * Social links). Each known platform has its official icon. "Other" takes a
 * name and shows a generic link icon, so a new profile can go up without a
 * code change; to give a platform its own icon later, add the icon to
 * src/components/ui/icon.tsx and an entry here (the Keystatic select reads
 * this list).
 */
export const socialPlatforms = {
  instagram: {
    label: "Instagram",
    icon: "instagram",
    hosts: ["instagram.com"],
  },
  facebook: {
    label: "Facebook",
    icon: "facebook",
    hosts: ["facebook.com", "fb.com"],
  },
  other: { label: "Other", icon: "link", hosts: [] as string[] },
} as const satisfies Record<
  string,
  { label: string; icon: IconName; hosts: readonly string[] }
>;

export type SocialPlatform = keyof typeof socialPlatforms;

export type SocialLink = {
  platform: SocialPlatform;
  /** The accessible name: the platform's, or the editor's for "Other". */
  label: string;
  url: string;
  icon: IconName;
};

/**
 * A usable link from an editor's entry, or null if it isn't one. Accepts a
 * bare Instagram handle ("name" or "@name"); everything else must be an
 * https URL, on the platform's own site for a known platform.
 */
export function socialLink(
  platform: SocialPlatform,
  rawUrl: string,
  rawLabel = "",
): SocialLink | null {
  const meta = socialPlatforms[platform];
  if (!meta) return null;
  let value = rawUrl.trim();
  if (platform === "instagram" && /^@?[A-Za-z0-9._]{1,30}$/.test(value)) {
    value = `https://www.instagram.com/${value.replace(/^@/, "")}/`;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www|m)\./, "");
  if (
    meta.hosts.length > 0 &&
    !(meta.hosts as readonly string[]).includes(host)
  )
    return null;
  const label = platform === "other" ? rawLabel.trim() || host : meta.label;
  return { platform, label, url: url.href, icon: meta.icon };
}
