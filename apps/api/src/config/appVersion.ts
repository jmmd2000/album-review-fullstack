// The build bundles the JSON in, because the production image has no package.json to read
import rootPackage from "../../../../package.json";

/** The site's version, from the root package.json */
export const APP_VERSION = rootPackage.version;
