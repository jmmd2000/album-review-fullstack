interface Feature {
  name: string;
}

/**
 * If a tracks title mentions a featured artist, remove it from the title so that its not repeated in the features list
 */
export function extraFeatures(trackName: string, features: Feature[]): Feature[] {
  const title = trackName.toLowerCase();
  return features.filter(feature => !title.includes(feature.name.toLowerCase()));
}
