import { ArtistImageService } from "@/api/services/ArtistImageService";
import { ListenerLinkService } from "@/api/services/ListenerLinkService";
import { SuggestionService } from "@/api/services/SuggestionService";
import type { JobEmit } from "@/api/services/JobService";
import type { ArtistJobSource } from "@/api/schemas/artistJobResultSchema";

export interface ScheduledJob {
  /** Names the job in the API path, such as POST /api/jobs/artist-images */
  name: string;
  /** Starts the job's setting keys, such as artist_images_last_run */
  settingName: string;
  /** The 409 message when a run of the job is already going */
  busyMessage: string;
  run: (emit: JobEmit, source: ArtistJobSource) => Promise<void>;
}

/** The jobs the scheduler can run. A scheduled check runs the due jobs in this order. */
export const scheduledJobs: ScheduledJob[] = [
  {
    name: "artist-images",
    settingName: "artist_images",
    busyMessage: "The artist photos are already updating. Try again when that run finishes.",
    run: (emit, source) => ArtistImageService.updateArtistImages(true, undefined, emit, source),
  },
  {
    name: "artist-headers",
    settingName: "artist_headers",
    busyMessage: "The artist headers are already updating. Try again when that run finishes.",
    run: (emit, source) => ArtistImageService.updateArtistHeaders(true, undefined, emit, source),
  },
  {
    name: "listener-links",
    settingName: "listener_links",
    busyMessage: "The listener links are already updating. Try again when that run finishes.",
    run: emit => ListenerLinkService.refreshAllArtists(emit),
  },
  {
    name: "album-suggestions",
    settingName: "album_suggestions",
    busyMessage: "The album suggestions are already updating. Try again when that run finishes.",
    run: emit => SuggestionService.refreshNewAlbums(emit),
  },
];

export function findScheduledJob(name: string): ScheduledJob | undefined {
  return scheduledJobs.find(job => job.name === name);
}
