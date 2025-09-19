import { ImageProvider } from './index';
import { MockProvider } from './mock';
import { DalleProvider } from './dalle';

export function getProviders(): ImageProvider[] {
    console.log('process.env.MOCK_IMAGES', process.env.MOCK_IMAGES);

  if (process.env.MOCK_IMAGES === 'true') {
      console.log('process.env.MOCK_IMAGES so its true', process.env.MOCK_IMAGES);

    return [
      new MockProvider('dalle', 2000),
      new MockProvider('stability', 3000),
      new MockProvider('midjourney', 4000),
    ];
  }
  
  return [
    new DalleProvider(),
    // Add other providers here when ready
    // new StabilityProvider(),
    // new MidjourneyProvider(),
  ];
}
