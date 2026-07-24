interface SocialMetaOptions {
  /** The page's own title, the site name gets appended */
  title: string;
  /** A sentence or two for search results and unfurl cards */
  description: string;
  /** Absolute url for the unfurl thumbnail */
  image?: string;
}

/**
 * Builds a route head()'s meta array: the tab title, the description and the
 * og and twitter tags unfurlers read. Deeper routes win over the root
 * defaults, the router dedupes by tag name.
 */
export function socialMeta({ title, description, image }: SocialMetaOptions) {
  // The home page passes the site name itself, no point doubling it up
  const fullTitle = title === "JamesReviewsMusic" ? title : `${title} | JamesReviewsMusic`;
  const tags: Array<Record<string, string>> = [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "JamesReviewsMusic" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
  ];
  if (image) {
    tags.push({ property: "og:image", content: image }, { name: "twitter:image", content: image });
  }
  return tags;
}
