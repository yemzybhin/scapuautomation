import { PlacardPlatform } from '@/services/OpinionPlacardRepository';

export type PublishInput = {
  videoPath: string;
  title: string;
  description: string;
};

export type PublishResult = {
  externalId: string;
  url: string;
};

export interface SocialPublisher {
  readonly platform: PlacardPlatform;
  isConfigured(): boolean;
  publish(input: PublishInput): Promise<PublishResult>;
}

/**
 * Raised when a publish fails because the credentials lack the required permission
 * (for example, LinkedIn organization posting before the page scope is granted).
 * These failures are not counted as publish attempts, so the placard stays in the
 * retry queue until the credentials are upgraded.
 */
export class PublisherPermissionError extends Error {}
