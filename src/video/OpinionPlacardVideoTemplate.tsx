import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import { OpinionPlacardVideoProps } from './types';

const fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
const wordmarkFontFamily = '"Mokoto", -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
const logoRatio = 0.747;
const appStoreRatio = 119.66 / 40;
const playStoreRatio = 238.96 / 70.87;
const backgroundGlow = '#F0F400';
const cardPadding = 56;
const questionLineHeight = 44;

const theme = {
  bg: '#0a0a0a',
  text: '#ffffff',
  muted: '#8e8e93',
  line: '#2a2a2a',
};

const formatVoteCount = (value: number): string => {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
  }

  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`;
  }

  return String(value);
};

const estimateLineCount = (value: string, maxWidth: number, fontSize: number): number => {
  const words = value.split(/\s+/).filter(Boolean);
  const averageCharWidth = fontSize * 0.56;
  const maxChars = Math.max(12, Math.floor(maxWidth / averageCharWidth));
  let lineLength = 0;
  let lineCount = 1;

  for (const word of words) {
    const nextLength = lineLength === 0 ? word.length : lineLength + 1 + word.length;

    if (nextLength > maxChars && lineLength > 0) {
      lineCount += 1;
      lineLength = word.length;
    } else {
      lineLength = nextLength;
    }
  }

  return Math.min(6, Math.max(1, lineCount));
};

const avatarColor = (name: string): string => {
  const palette = ['#F5E11D', '#34D17C', '#5B9BFF', '#C77DFF', '#FF9F45'];
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length];
};

/**
 * Frames of background footage shown alone before the placard slides up.
 * Every card animation below is offset by this, so the pacing after the intro
 * stays exactly as it was.
 */
const BACKGROUND_INTRO_FRAMES = 60;

const ScapuLogo: React.FC<{ height: number }> = ({ height }) => {
  return (
    <Img
      src={staticFile('scapu-logo.png')}
      style={{ width: height * logoRatio, height, objectFit: 'contain' }}
    />
  );
};

const AnimatedBackground: React.FC<{
  backgroundVideoSrc?: string | null;
  backgroundImageSrc?: string | null;
}> = ({ backgroundVideoSrc, backgroundImageSrc }) => {
  const frame = useCurrentFrame();
  // The footage carries the opening on its own, so it starts close to full
  // brightness and only dims once the card rises and needs contrast behind it.
  const dim = interpolate(
    frame,
    [BACKGROUND_INTRO_FRAMES - 10, BACKGROUND_INTRO_FRAMES + 30],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // A still with a slow push-in renders far faster than decoding video frames
  // while still reading as motion.
  if (backgroundImageSrc) {
    return (
      <>
        <Img
          src={staticFile(backgroundImageSrc)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            scale: interpolate(frame, [0, 330], [1.05, 1.18], {
              extrapolateRight: 'clamp',
            }),
            translate: `${Math.sin(frame * 0.008) * 14}px ${Math.cos(frame * 0.009) * 16}px`,
            filter: `brightness(${interpolate(dim, [0, 1], [1, 0.42])}) saturate(${interpolate(
              dim,
              [0, 1],
              [1.05, 0.7],
            )}) contrast(1.05)`,
          }}
        />
        <AbsoluteFill
          style={{
            opacity: interpolate(dim, [0, 1], [0, 1]),
            background: `radial-gradient(circle at ${50 + Math.sin(frame * 0.018) * 22}% ${42 + Math.cos(frame * 0.014) * 18}%, ${backgroundGlow}75, transparent 42%), linear-gradient(180deg, rgba(0,0,0,0.62), rgba(0,0,0,0.88))`,
          }}
        />
      </>
    );
  }

  if (backgroundVideoSrc) {
    return (
      <>
        <OffthreadVideo
          src={staticFile(backgroundVideoSrc)}
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            scale: interpolate(Math.sin(frame * 0.02), [-1, 1], [1.04, 1.15]),
            translate: `${Math.sin(frame * 0.01) * 20}px ${Math.cos(frame * 0.012) * 26}px`,
            filter: `brightness(${interpolate(dim, [0, 1], [1, 0.42])}) saturate(${interpolate(
              dim,
              [0, 1],
              [1.05, 0.7],
            )}) contrast(1.05)`,
          }}
        />
        <AbsoluteFill
          style={{
            opacity: interpolate(dim, [0, 1], [0, 1]),
            background: `radial-gradient(circle at ${50 + Math.sin(frame * 0.018) * 22}% ${42 + Math.cos(frame * 0.014) * 18}%, ${backgroundGlow}75, transparent 42%), linear-gradient(180deg, rgba(0,0,0,0.62), rgba(0,0,0,0.88))`,
          }}
        />
      </>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(circle at ${35 + Math.sin(frame * 0.014) * 18}% ${22 + Math.cos(frame * 0.012) * 10}%, ${backgroundGlow}b8, transparent 36%),
          radial-gradient(circle at ${76 + Math.cos(frame * 0.01) * 14}% ${74 + Math.sin(frame * 0.016) * 12}%, ${backgroundGlow}7a, transparent 42%),
          linear-gradient(155deg, #000000, #101100 46%, #000000)
        `,
      }}
    >
      <AbsoluteFill
        style={{
          opacity: 0.16,
          background:
            'repeating-linear-gradient(115deg, rgba(240,244,0,0.12) 0px, rgba(240,244,0,0.12) 1px, transparent 1px, transparent 18px)',
          translate: `${(frame % 90) - 45}px 0px`,
        }}
      />
    </AbsoluteFill>
  );
};

const TypingQuestion: React.FC<{
  question: string;
  startFrame: number;
  reservedLineCount: number;
  instant?: boolean;
}> = ({ question, startFrame, reservedLineCount, instant }) => {
  const frame = useCurrentFrame();
  const charsVisible = instant
    ? question.length
    : Math.floor(
        interpolate(frame, [startFrame, startFrame + 90], [0, question.length], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        }),
      );
  const visibleQuestion = question.slice(0, charsVisible);
  const cursorVisible = !instant && frame < startFrame + 105 && Math.floor(frame / 10) % 2 === 0;

  return (
    <div
      style={{
        minHeight: reservedLineCount * 44,
        maxWidth: '100%',
        fontSize: 35,
        lineHeight: 1.23,
        fontWeight: 850,
        color: theme.text,
        letterSpacing: 0,
        fontFamily,
        whiteSpace: 'normal',
        overflowWrap: 'break-word',
      }}
    >
      {visibleQuestion}
      {cursorVisible ? <span style={{ color: '#F5E11D' }}> |</span> : null}
    </div>
  );
};

const StoreBadges: React.FC<{ panelWidth: number }> = ({ panelWidth }) => {
  return (
    <div
      style={{
        height: 74,
        display: 'flex',
        gap: 16,
        alignItems: 'center',
      }}
    >
      <div style={{ width: (panelWidth - 16) / 2, height: 74, display: 'flex', justifyContent: 'center' }}>
        <Img
          src={staticFile('app-store-badge.svg')}
          style={{ width: 74 * appStoreRatio, height: 74, objectFit: 'contain' }}
        />
      </div>
      <div style={{ width: (panelWidth - 16) / 2, height: 74, display: 'flex', justifyContent: 'center' }}>
        <Img
          src={staticFile('play-store-badge.svg')}
          style={{ width: 74 * playStoreRatio, height: 74, objectFit: 'contain' }}
        />
      </div>
    </div>
  );
};

const FooterRow: React.FC = () => {
  return (
    <div
      style={{
        borderTop: `1px solid ${theme.line}`,
        paddingTop: 23,
        display: 'flex',
        alignItems: 'center',
        color: theme.text,
        fontFamily,
      }}
    >
      <ScapuLogo height={23} />
      <div style={{ marginLeft: 9, fontSize: 17, fontWeight: 850 }}>Scapu</div>
      <div style={{ marginLeft: 'auto', color: theme.muted, fontSize: 16, fontWeight: 500 }}>
        Cast your vote -&gt; scapu.app
      </div>
    </div>
  );
};

export const OpinionPlacardVideoTemplate: React.FC<OpinionPlacardVideoProps> = ({
  authorName,
  question,
  category,
  categoryColor,
  categoryAccentColor,
  timestamp,
  verified,
  agreeVotes,
  disagreeVotes,
  avatarDataUrl,
  backgroundVideoSrc,
  backgroundImageSrc,
  soundtrackSrc,
  soundtrackVolume,
  staticCardOnly,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const total = Math.max(0, Math.round(agreeVotes + disagreeVotes));
  const finalAgreePct = total > 0 ? agreeVotes / total : 0.5;
  const voteSpring = spring({
    frame: frame - (BACKGROUND_INTRO_FRAMES + 122),
    fps,
    config: {
      damping: 22,
      stiffness: 70,
      mass: 0.9,
    },
  });
  const voteProgress = staticCardOnly ? 1 : voteSpring;
  const agreePct = Math.min(finalAgreePct, Math.max(0, finalAgreePct * voteProgress));
  const displayedTotal = Math.round(total * Math.min(1, voteProgress));
  const cardIntro = spring({
    frame: frame - (BACKGROUND_INTRO_FRAMES + 8),
    fps,
    config: {
      damping: 20,
      stiffness: 90,
    },
  });
  const visualScale = staticCardOnly ? 1 : 0.95;
  const cardWidth = staticCardOnly ? width : width - 24;
  const panelWidth = cardWidth - cardPadding * 2;
  const questionLineCount = estimateLineCount(question, panelWidth, 35);
  const questionBlockHeight = questionLineCount * questionLineHeight;
  const cardHeight = staticCardOnly ? 768 + questionBlockHeight : 676 + questionBlockHeight;
  // Free space above and below the card is split 1.5 : 2, so the card sits just
  // above centre instead of pinned to the top.
  const freeVerticalSpace = Math.max(0, height - cardHeight);
  const cardTop = staticCardOnly ? 0 : Math.max(24, (freeVerticalSpace * 1.5) / 3.5);
  const cardLeft = (width - cardWidth) / 2;
  const chipWidthScaled = category.length * 12 + 38;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      {staticCardOnly || !soundtrackSrc ? null : (
        <Audio
          src={staticFile(soundtrackSrc)}
          volume={currentFrame =>
            // Ease in at the top and out at the tail so the bed never clips.
            interpolate(
              currentFrame,
              [0, 20, durationInFrames - 40, durationInFrames],
              [0, soundtrackVolume ?? 0.4, soundtrackVolume ?? 0.4, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            )
          }
        />
      )}
      {staticCardOnly ? null : (
        <AnimatedBackground
          backgroundVideoSrc={backgroundVideoSrc}
          backgroundImageSrc={backgroundImageSrc}
        />
      )}

      {staticCardOnly ? null : (
        <AbsoluteFill
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.72))',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          left: cardLeft,
          top: cardTop,
          width: cardWidth,
          height: cardHeight,
          padding: cardPadding,
          boxSizing: 'border-box',
          backgroundColor: theme.bg,
          border: staticCardOnly ? 'none' : '1px solid rgba(255,255,255,0.28)',
          borderRadius: staticCardOnly ? 0 : 22,
          boxShadow: staticCardOnly ? 'none' : `0 34px 100px rgba(0,0,0,0.55), 0 0 80px ${backgroundGlow}35`,
          transformOrigin: 'center center',
          opacity: staticCardOnly
            ? 1
            : interpolate(cardIntro, [0, 1], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
          scale: staticCardOnly
            ? 1
            : interpolate(cardIntro, [0, 1], [0.91, visualScale], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
          translate: staticCardOnly
            ? '0px 0px'
            : `0px ${interpolate(cardIntro, [0, 1], [520, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              })}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', height: 48, fontFamily }}>
          <ScapuLogo height={32} />
          <div style={{ marginLeft: 14, color: theme.text, fontSize: 23, fontWeight: 850 }}>
            Opinion Bar
            <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 4, position: 'relative', top: -10 }}>
              ™
            </span>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              width: 100,
              height: 34,
              borderRadius: 17,
              backgroundColor: '#F5E11D',
              color: '#000',
              fontWeight: 850,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            OPINION
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 28,
            textAlign: 'center',
            fontWeight: 900,
            color: theme.text,
            fontSize: 30,
            letterSpacing: 2,
            fontFamily: wordmarkFontFamily,
          }}
        >
          SCAPU
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 74 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              overflow: 'hidden',
              backgroundColor: avatarColor(authorName),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 850,
              fontSize: 23,
              flex: 'none',
              fontFamily,
            }}
          >
            {avatarDataUrl ? (
              <Img src={avatarDataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              authorName.trim()[0]?.toUpperCase() ?? '?'
            )}
          </div>
          <div style={{ marginLeft: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', color: theme.text }}>
              <span style={{ fontSize: 24, fontWeight: 850, fontFamily }}>{authorName}</span>
              {verified ? (
                <Img
                  src={staticFile('verified.svg')}
                  style={{
                    marginLeft: 11,
                    width: 19,
                    height: 19,
                    objectFit: 'contain',
                  }}
                />
              ) : null}
            </div>
            <div style={{ color: theme.muted, fontSize: 17, fontWeight: 500, marginTop: 3, fontFamily }}>
              {timestamp}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 62 }}>
          <TypingQuestion
            question={question}
            startFrame={BACKGROUND_INTRO_FRAMES + 42}
            reservedLineCount={questionLineCount}
            instant={staticCardOnly}
          />
        </div>

        <div
          style={{
            width: chipWidthScaled,
            height: 38,
            marginTop: 26,
            borderRadius: 8,
            border: `2px solid ${categoryColor}`,
            color: categoryColor,
            fontSize: 17,
            fontWeight: 850,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 22px ${categoryAccentColor}45`,
            fontFamily,
          }}
        >
          {category.toUpperCase()}
        </div>

        <div
          style={{
            marginTop: 34,
            color: theme.text,
            fontSize: 19,
            fontWeight: 850,
            letterSpacing: 1.5,
            fontFamily,
          }}
        >
          {formatVoteCount(displayedTotal)} VOTES
        </div>

        <div
          style={{
            marginTop: 12,
            height: 64,
            width: panelWidth,
            borderRadius: 32,
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.12)',
            display: 'flex',
            boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${agreePct * 100}%`,
              backgroundColor: '#34D17C',
            }}
          />
          <div
            style={{
              height: '100%',
              flex: 1,
              backgroundColor: '#FF4D5E',
              opacity: voteProgress > 0.01 ? 1 : 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              marginLeft: 24,
              marginTop: 20,
              color: '#06200f',
              fontSize: 21,
              fontWeight: 850,
              fontFamily,
            }}
          >
            {Math.round(finalAgreePct * voteProgress * 100)}%
          </div>
          <div
            style={{
              position: 'absolute',
              right: 16,
              marginTop: 20,
              color: '#2b0608',
              fontSize: 21,
              fontWeight: 850,
              opacity: voteProgress > 0.65 ? 1 : 0,
              fontFamily,
            }}
          >
            {Math.round((1 - finalAgreePct) * 100)}%
          </div>
        </div>
        {staticCardOnly ? (
          <div style={{ marginTop: 64 }}>
            <FooterRow />
            <div style={{ marginTop: 21 }}>
              <StoreBadges panelWidth={panelWidth} />
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                position: 'absolute',
                left: cardPadding,
                right: cardPadding,
                bottom: 118,
              }}
            >
              <FooterRow />
            </div>

            <div
              style={{
                position: 'absolute',
                left: cardPadding,
                right: cardPadding,
                bottom: 14,
              }}
            >
              <StoreBadges panelWidth={panelWidth} />
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
