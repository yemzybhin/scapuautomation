import { AvatarEthnicity } from '@/constants/opinionPlacardRegions';

export type AvatarRequest = {
  ethnicity: AvatarEthnicity;
  /** Free-text look description already produced for the persona. */
  photoDescriptor: string;
  /** Stable per-run number so a provider can vary its pick deterministically. */
  seed: number;
};

export interface AvatarProvider {
  readonly name: string;
  isConfigured(): boolean;
  /** Returns raw image bytes, or throws so the chain can fall through. */
  fetchAvatar(request: AvatarRequest): Promise<Buffer>;
}
