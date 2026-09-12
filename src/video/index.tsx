import { VideoTemplate } from './types';
import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { OpinionPlacardVideoTemplate } from './OpinionPlacardVideoTemplate';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={VideoTemplate.OPINION_PLACARD}
        component={OpinionPlacardVideoTemplate}
        durationInFrames={270}
        fps={30}
        width={720}
        height={1280}
        defaultProps={{
          authorName: 'David Ayo',
          question: 'Should fans get more say in big decisions?',
          category: 'Sports',
          categoryColor: '#FF4500',
          categoryAccentColor: '#FF8C5B',
          timestamp: '2 hours ago',
          verified: true,
          agreeVotes: 33500,
          disagreeVotes: 16500,
          avatarDataUrl: null,
          backgroundVideoSrc: null,
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
