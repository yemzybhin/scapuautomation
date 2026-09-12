import { QuantixCategory } from '../constants/enums';

export type VideoConfigType = {
  /**
   * Main highlighted text color
   */
  accentColor: string;

  /**
   * Default subtitle color
   */
  textColor: string;

  /**
   * Subtitle container background
   */
  subtitleBackground: string;

  /**
   * Cinematic ambient glow color
   */
  ambientColor: string;

  /**
   * Lens flare colors
   */
  flareColors: {
    primary: string;
    secondary: string;
  };

  /**
   * Typography
   */
  fontFamily: string;

  /**
   * Optional cinematic tint
   */
  overlayTint: string;

  /**
   * Glitch tint colors
   */
  glitchColors: {
    left: string;
    right: string;
  };

  /**
   * Mood profile
   */
  vibe: 'organic' | 'cosmic' | 'scientific' | 'futuristic' | 'historical' | 'psychological';
};

export const getVideoConfig = (category: string): VideoConfigType => {
  const usable =
    category === 'life'
      ? QuantixCategory.ANIMALS
      : category === 'earth'
        ? QuantixCategory.EARTH
        : category === 'mind'
          ? QuantixCategory.MIND
          : (category as QuantixCategory);

  switch (usable) {
    case QuantixCategory.ANIMALS:
    case QuantixCategory.PLANTS:
    case QuantixCategory.MICROBES:
    case QuantixCategory.ENVIRONMENT:
      return {
        accentColor: '#e24017ff',
        textColor: '#FFFFFF',

        subtitleBackground: 'rgba(5,20,10,0.72)',

        ambientColor: 'rgba(100,255,170,0.16)',

        flareColors: {
          primary: 'rgba(247, 130, 63, 0.95)',
          secondary: 'rgba(167, 40, 17, 0.55)',
        },

        fontFamily: `'Barlow Condensed', 'Arial Narrow', 'Helvetica Neue', sans-serif`,

        overlayTint: 'rgba(40,120,60,0.08)',

        glitchColors: {
          left: '#e24017ff',
          right: '#ebab92ff',
        },

        vibe: 'organic',
      };

    /**
     * 🌍 EARTH
     * Geology / Climate / Oceans
     */
    case QuantixCategory.EARTH:
      return {
        accentColor: '#4DD0FF',
        textColor: '#FFFFFF',

        subtitleBackground: 'rgba(5,15,25,0.72)',

        ambientColor: 'rgba(80,180,255,0.14)',

        flareColors: {
          primary: 'rgba(120,220,255,0.95)',
          secondary: 'rgba(60,150,255,0.55)',
        },

        fontFamily: `'Oswald', 'Arial Narrow', 'Helvetica Neue', sans-serif`,

        overlayTint: 'rgba(20,70,120,0.08)',

        glitchColors: {
          left: '#6AE3FF',
          right: '#A8F5FF',
        },

        vibe: 'scientific',
      };

    /**
     * 🌌 SPACE
     * Cosmos / Black holes / Galaxies
     */
    case QuantixCategory.SPACE:
      return {
        accentColor: '#CFA8FF',
        textColor: '#FFFFFF',

        subtitleBackground: 'rgba(10,8,25,0.74)',

        ambientColor: 'rgba(150,100,255,0.16)',

        flareColors: {
          primary: 'rgba(220,180,255,1)',
          secondary: 'rgba(140,90,255,0.65)',
        },

        fontFamily: `'Teko', 'Arial Narrow', 'Helvetica Neue', sans-serif`,

        overlayTint: 'rgba(80,40,140,0.12)',

        glitchColors: {
          left: '#B76EFF',
          right: '#F2D4FF',
        },

        vibe: 'cosmic',
      };

    /**
     * ⚛️ PHYSICS
     * Quantum / Relativity / Energy
     */
    case QuantixCategory.PHYSICS:
      return {
        accentColor: '#FFE66D',
        textColor: '#FFFFFF',

        subtitleBackground: 'rgba(20,20,10,0.72)',

        ambientColor: 'rgba(255,220,100,0.12)',

        flareColors: {
          primary: 'rgba(255,240,160,1)',
          secondary: 'rgba(255,200,70,0.55)',
        },

        fontFamily: `'Bebas Neue', 'Arial Narrow', 'Helvetica Neue', sans-serif`,

        overlayTint: 'rgba(120,100,20,0.08)',

        glitchColors: {
          left: '#FFD84A',
          right: '#FFF4A8',
        },

        vibe: 'scientific',
      };

    /**
     * 🧪 CHEMISTRY
     * Molecules / Reactions / Elements
     */
    case QuantixCategory.CHEMISTRY:
      return {
        accentColor: '#7BFFDA',
        textColor: '#FFFFFF',

        subtitleBackground: 'rgba(5,25,22,0.74)',

        ambientColor: 'rgba(80,255,210,0.12)',

        flareColors: {
          primary: 'rgba(120,255,230,0.95)',
          secondary: 'rgba(40,210,180,0.5)',
        },

        fontFamily: `'Archivo Narrow', 'Arial Narrow', 'Helvetica Neue', sans-serif`,

        overlayTint: 'rgba(20,120,100,0.08)',

        glitchColors: {
          left: '#3DFFD4',
          right: '#B4FFF2',
        },

        vibe: 'scientific',
      };

    /**
     * 🧠 MIND
     * Psychology / Consciousness / Memory
     */
    case QuantixCategory.MIND:
      return {
        accentColor: '#FF9BEF',
        textColor: '#FFFFFF',

        subtitleBackground: 'rgba(25,8,30,0.72)',

        ambientColor: 'rgba(255,120,220,0.12)',

        flareColors: {
          primary: 'rgba(255,180,240,0.92)',
          secondary: 'rgba(255,100,200,0.45)',
        },

        fontFamily: `'Roboto Condensed', 'Arial Narrow', 'Helvetica Neue', sans-serif`,

        overlayTint: 'rgba(120,30,100,0.08)',

        glitchColors: {
          left: '#FF7BE5',
          right: '#FFD6F8',
        },

        vibe: 'psychological',
      };

    /**
     * 🫀 HUMAN BODY
     * Anatomy / Medicine / Cells
     */
    case QuantixCategory.HUMAN_BODY:
    case QuantixCategory.HEALTH_MEDICINE:
      return {
        accentColor: '#FF7B7B',
        textColor: '#FFFFFF',

        subtitleBackground: 'rgba(30,8,8,0.72)',

        ambientColor: 'rgba(255,80,80,0.12)',

        flareColors: {
          primary: 'rgba(255,160,160,0.95)',
          secondary: 'rgba(255,80,80,0.45)',
        },

        fontFamily: `'Barlow Condensed', 'Arial Narrow', 'Helvetica Neue', sans-serif`,

        overlayTint: 'rgba(120,20,20,0.08)',

        glitchColors: {
          left: '#FF6565',
          right: '#FFD1D1',
        },

        vibe: 'organic',
      };

    /**
     * 📜 SCIENCE HISTORY
     * Scientists / Discoveries / Timelines
     */
    case QuantixCategory.SCIENCE_HISTORY:
      return {
        accentColor: '#F7D28B',
        textColor: '#FFFFFF',

        subtitleBackground: 'rgba(28,20,10,0.75)',

        ambientColor: 'rgba(255,210,120,0.1)',

        flareColors: {
          primary: 'rgba(255,220,160,0.9)',
          secondary: 'rgba(210,170,90,0.45)',
        },

        fontFamily: `'Oswald', 'Arial Narrow', 'Georgia', serif`,

        overlayTint: 'rgba(110,80,30,0.08)',

        glitchColors: {
          left: '#FFD78A',
          right: '#FFF0CC',
        },

        vibe: 'historical',
      };

    /**
     * 🤖 TECHNOLOGY
     * AI / Robotics / Computing
     */
    case QuantixCategory.TECHNOLOGY:
    case QuantixCategory.ENGINEERING:
      return {
        accentColor: '#00F0FF',
        textColor: '#FFFFFF',

        subtitleBackground: 'rgba(0,10,18,0.75)',

        ambientColor: 'rgba(0,220,255,0.14)',

        flareColors: {
          primary: 'rgba(120,255,255,1)',
          secondary: 'rgba(0,180,255,0.55)',
        },

        fontFamily: `'Teko', 'Arial Narrow', 'Helvetica Neue', sans-serif`,

        overlayTint: 'rgba(0,120,160,0.08)',

        glitchColors: {
          left: '#00E5FF',
          right: '#B8FFFF',
        },

        vibe: 'futuristic',
      };

    default: {
      const exhaustiveCheck: never = usable;

      throw new Error(`Unhandled category: ${exhaustiveCheck}`);
    }
  }
};
