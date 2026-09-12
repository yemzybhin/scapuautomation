import { QuantixCategory } from '@/constants/enums';

interface VoiceSettings {
  voiceName:
    | 'Algenib'
    | 'Algieba'
    | 'Enceladus'
    | 'Erinome'
    | 'Kore'
    | 'Sulafat'
    | 'Achernar'
    | 'Autonoe'
    | 'Aoede';
  gender: 'male' | 'female';
  description: string;
  soundTrack: string;
}

export const getVoiceConfig = (category: QuantixCategory): VoiceSettings => {
  const usable =
    category === ('life' as QuantixCategory)
      ? QuantixCategory.ANIMALS
      : category === ('earth' as QuantixCategory)
        ? QuantixCategory.EARTH
        : category === ('mind' as QuantixCategory)
          ? QuantixCategory.MIND
          : category;

  switch (usable) {
    case QuantixCategory.SPACE:
      return {
        voiceName: 'Achernar',
        gender: 'female',
        description:
          'Engaging, Ethereal and atmospheric female voice with a sense of wonder, perfect for the vastness of the cosmos.',
        soundTrack: 'https://cdn.adquizzerltd.com/quantix/soundtracks/space.mp3',
      };

    case QuantixCategory.PHYSICS:
      return {
        voiceName: 'Algenib',
        gender: 'male',
        description: 'Engaging, authoritative, and steady male voice.',
        soundTrack: 'https://cdn.adquizzerltd.com/quantix/soundtracks/physics.mp3',
      };

    case QuantixCategory.CHEMISTRY:
      return {
        voiceName: 'Kore',
        gender: 'female',
        description:
          'Engaging, bright, and youthful female voice, that brings a sense of reaction and excitement.',
        soundTrack: 'https://cdn.adquizzerltd.com/quantix/soundtracks/chemistry.mp3',
      };

    case QuantixCategory.ANIMALS:
    case QuantixCategory.PLANTS:
    case QuantixCategory.MICROBES:
    case QuantixCategory.ENVIRONMENT:
      return {
        voiceName: 'Aoede',
        gender: 'female',
        description:
          'Engaging, warm, clear, and melodic female voice, ideal for natural science storytelling.',
        soundTrack: 'https://cdn.adquizzerltd.com/quantix/soundtracks/life.mp3',
      };

    case QuantixCategory.HUMAN_BODY:
    case QuantixCategory.HEALTH_MEDICINE:
      return {
        voiceName: 'Erinome',
        gender: 'female',
        description:
          'Engaging, articulate, and professional female voice with an educational clarity suited for anatomy and health.',
        soundTrack: 'https://cdn.adquizzerltd.com/quantix/soundtracks/human_body.mp3',
      };

    case QuantixCategory.MIND:
      return {
        voiceName: 'Sulafat',
        gender: 'female',
        description:
          'Soft, inviting, and thoughtful female voice with smooth clarity for psychology and the inner self.',
        soundTrack: 'https://cdn.adquizzerltd.com/quantix/soundtracks/mind.mp3',
      };

    case QuantixCategory.TECHNOLOGY:
    case QuantixCategory.ENGINEERING:
      return {
        voiceName: 'Algieba',
        gender: 'male',
        description:
          'Bold, modern, and sharp male voice with a futuristic edge, perfect for innovation and digital breakthroughs.',
        soundTrack: 'https://cdn.adquizzerltd.com/quantix/soundtracks/technology.mp3',
      };

    case QuantixCategory.EARTH:
      return {
        voiceName: 'Autonoe',
        gender: 'female',
        description:
          'Engaging and authoritative female voice fitting for geological and environmental scales.',
        soundTrack: 'https://cdn.adquizzerltd.com/quantix/soundtracks/earth.mp3',
      };

    case QuantixCategory.SCIENCE_HISTORY:
      return {
        voiceName: 'Enceladus',
        gender: 'male',
        description:
          'Friendly and engaging male voice that feels like a relatable narrator sharing a classic story of discovery.',
        soundTrack: 'https://cdn.adquizzerltd.com/quantix/soundtracks/science_history.mp3',
      };
  }

  const exhaustiveCheck: never = usable;
  throw new Error(`Unhandled category: ${exhaustiveCheck}`);
};
