import { ImageProvider, ImageResult } from './index';

export class MockProvider implements ImageProvider {
  private providerName: string;
  private delay: number;

  constructor(providerName: string, delay: number = 2000) {
    this.providerName = providerName;
    this.delay = delay;
  }

  async generateImage(): Promise<ImageResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 10% chance of failure for testing
        if (Math.random() < 0.1) {
          resolve({
            imageUrl: null,
            success: false,
            error: `Mock ${this.providerName} service temporarily unavailable`
          });
        } else {
          resolve({
            imageUrl: 'https://aaxr3zh5x0.ufs.sh/f/VKo1Weu7HOuKcjeODcnb2YoPNKSWxHC78qjQ4VZF5nRkBDs9',
            success: true
          });
        }
      }, this.delay);
    });
  }

  getName(): string {
    return this.providerName;
  }
}
