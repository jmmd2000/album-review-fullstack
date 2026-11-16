interface SocialMetaOptions {
  /** The page's own title, the site name gets appended */
  title: string;
  /** A sentence or two for search results and unfurl cards */
  description: string;
  /** Absolute url for the unfurl thumbnail, the site's default card when missing */
  image?: string;
}

// Unfurlers need a full url. Staging uses the production copy, it is the same file
const defaultImage = {
  url: "https://jamesreviewsmusic.com/og-default.jpg",
  width: "1200",
  height: "630",
  alt: "JamesReviewsMusic, with a wall of the highest scoring album covers",
};

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
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
  ];

  // Covers and artist photos are square, so they stay small thumbnails
  if (image) {
    tags.push({ name: "twitter:card", content: "summary" }, { property: "og:image", content: image }, { name: "twitter:image", content: image });
    return tags;
  }

  tags.push(
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:image", content: defaultImage.url },
    { property: "og:image:width", content: defaultImage.width },
    { property: "og:image:height", content: defaultImage.height },
    { property: "og:image:alt", content: defaultImage.alt },
    { name: "twitter:image", content: defaultImage.url },
    { name: "twitter:image:alt", content: defaultImage.alt }
  );
  return tags;
}
