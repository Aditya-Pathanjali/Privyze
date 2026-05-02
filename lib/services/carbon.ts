// Carbon estimation service
import { CARBON_PER_KB, CARBON_EQUIVALENTS, TREE_CO2_REMOVAL_G_PER_YEAR } from '@/lib/constants';

export class CarbonService {
  // Average person's annual footprint (US: ~4,600 kg CO2e/year)
  private static readonly AVERAGE_ANNUAL_FOOTPRINT_KG = 4600;
  private static readonly AVERAGE_DAILY_FOOTPRINT_G = 4600 * 1000 / 365; // ~12.6g/day
  private static readonly AVERAGE_MINUTE_FOOTPRINT_G = 4600 * 1000 / (365 * 24 * 60); // ~0.87g/minute

  /**
   * Calculate estimated carbon footprint in grams of CO2
   */
  static calculateCarbon(sizeKB: number): number {
    return Math.round(sizeKB * CARBON_PER_KB * 1000) / 1000;
  }

  /**
   * Get percentage of average person's daily/minute footprint
   */
  static getFootprintPercentage(carbonGrams: number, period: 'daily' | 'minute' = 'minute'): string {
    let averageFootprint: number;
    
    switch (period) {
      case 'daily':
        averageFootprint = this.AVERAGE_DAILY_FOOTPRINT_G;
        break;
      case 'minute':
      default:
        averageFootprint = this.AVERAGE_MINUTE_FOOTPRINT_G;
        break;
    }

    const percentage = (carbonGrams / averageFootprint) * 100;
    return percentage < 0.01 
      ? `<0.01% of average person's ${period} footprint`
      : `${percentage.toFixed(3)}% of average person's ${period} footprint`;
  }

  /**
   * Get human-readable equivalent of carbon footprint
   */
  static getEquivalent(carbonGrams: number): string {
    const ranges = Object.keys(CARBON_EQUIVALENTS)
      .map(Number)
      .sort((a, b) => a - b);

    for (const range of ranges) {
      if (carbonGrams <= range) {
        return CARBON_EQUIVALENTS[range];
      }
    }

    const lastRange = ranges[ranges.length - 1];
    const multiplier = Math.ceil(carbonGrams / lastRange);
    return `equivalent to ${multiplier}x driving 5km`;
  }

  /**
   * Convert carbon grams into years for one tree to remove.
   */
  static getTreeRemovalYears(carbonGrams: number): number {
    return Math.max(0, carbonGrams / TREE_CO2_REMOVAL_G_PER_YEAR);
  }

  /**
   * Format tree removal time for display.
   */
  static formatTreeRemovalTime(years: number): string {
    if (years < 0.02) {
      const minutes = Math.round(years * 365 * 24 * 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} for one tree to absorb it`;
    }

    if (years < 1) {
      const months = Math.round(years * 12);
      return `${months} month${months === 1 ? '' : 's'} for one tree to absorb it`;
    }

    if (years < 10) {
      return `${years.toFixed(1)} year${years === 1 ? '' : 's'} for one tree to absorb it`;
    }

    return `${years.toFixed(0)} years for one tree to absorb it`;
  }

  /**
   * Calculate reduction percentage
   */
  static calculateReduction(before: number, after: number): number {
    if (before === 0) return 0;
    return Math.round(((before - after) / before) * 100);
  }

  /**
   * Format carbon value for display
   */
  static formatCarbon(grams: number): string {
    if (grams < 1) {
      return `${(grams * 1000).toFixed(1)} mg CO₂`;
    } else if (grams < 1000) {
      return `${grams.toFixed(2)} g CO₂`;
    } else {
      return `${(grams / 1000).toFixed(2)} kg CO₂`;
    }
  }

  /**
   * Get comprehensive display string with all comparisons
   */
  static getDisplayInfo(carbonGrams: number): {
    formatted: string;
    equivalent: string;
    percentage: string;
    treeRemovalTime: string;
    treeYears: number;
  } {
    const treeYears = this.getTreeRemovalYears(carbonGrams);
    return {
      formatted: this.formatCarbon(carbonGrams),
      equivalent: this.getEquivalent(carbonGrams),
      percentage: this.getFootprintPercentage(carbonGrams),
      treeRemovalTime: this.formatTreeRemovalTime(treeYears),
      treeYears,
    };
  }
}