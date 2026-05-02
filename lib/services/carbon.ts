// Carbon estimation service
import {
  CARBON_PER_KB,
  CARBON_EQUIVALENTS,
  TREE_CO2_REMOVAL_G_PER_YEAR,
} from '@/lib/constants';

function clampFinite(value: number, min = 0): number {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export class CarbonService {
  // Average person's annual footprint (US: ~4,600 kg CO2e/year)
  private static readonly AVERAGE_ANNUAL_FOOTPRINT_KG = 4600;
  private static readonly AVERAGE_DAILY_FOOTPRINT_G =
    (CarbonService.AVERAGE_ANNUAL_FOOTPRINT_KG * 1000) / 365;
  private static readonly AVERAGE_MINUTE_FOOTPRINT_G =
    (CarbonService.AVERAGE_ANNUAL_FOOTPRINT_KG * 1000) / (365 * 24 * 60);

  /**
   * Calculate estimated carbon footprint in grams of CO2.
   */
  static calculateCarbon(sizeKB: number): number {
    const safeSizeKB = clampFinite(sizeKB);
    return Math.round(safeSizeKB * CARBON_PER_KB * 1000) / 1000;
  }

  /**
   * Get percentage of average person's daily/minute footprint.
   */
  static getFootprintPercentage(
    carbonGrams: number,
    period: 'daily' | 'minute' = 'minute'
  ): string {
    const averageFootprint =
      period === 'daily'
        ? this.AVERAGE_DAILY_FOOTPRINT_G
        : this.AVERAGE_MINUTE_FOOTPRINT_G;
    const percentage = (clampFinite(carbonGrams) / averageFootprint) * 100;

    return percentage < 0.01
      ? `<0.01% of average person's ${period} footprint`
      : `${percentage.toFixed(3)}% of average person's ${period} footprint`;
  }

  /**
   * Get human-readable equivalent of carbon footprint.
   */
  static getEquivalent(carbonGrams: number): string {
    const safeCarbon = clampFinite(carbonGrams);
    const ranges = Object.keys(CARBON_EQUIVALENTS)
      .map(Number)
      .sort((a, b) => a - b);

    for (const range of ranges) {
      if (safeCarbon <= range) {
        return CARBON_EQUIVALENTS[range];
      }
    }

    const lastRange = ranges[ranges.length - 1] || 1;
    const multiplier = Math.ceil(safeCarbon / lastRange);
    return `equivalent to ${multiplier}x driving 5km`;
  }

  /**
   * Convert carbon grams into years for one tree to remove.
   */
  static getTreeRemovalYears(carbonGrams: number): number {
    return clampFinite(carbonGrams) / TREE_CO2_REMOVAL_G_PER_YEAR;
  }

  /**
   * Format tree removal time for display.
   */
  static formatTreeRemovalTime(years: number): string {
    const safeYears = clampFinite(years);

    if (safeYears < 0.02) {
      const minutes = Math.round(safeYears * 365 * 24 * 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} for one tree to absorb it`;
    }

    if (safeYears < 1) {
      const months = Math.round(safeYears * 12);
      return `${months} month${months === 1 ? '' : 's'} for one tree to absorb it`;
    }

    if (safeYears < 10) {
      return `${safeYears.toFixed(1)} year${safeYears === 1 ? '' : 's'} for one tree to absorb it`;
    }

    return `${safeYears.toFixed(0)} years for one tree to absorb it`;
  }

  /**
   * Calculate reduction percentage.
   */
  static calculateReduction(before: number, after: number): number {
    const safeBefore = clampFinite(before);
    const safeAfter = clampFinite(after);
    if (safeBefore === 0) return 0;
    return Math.max(
      0,
      Math.min(100, Math.round(((safeBefore - safeAfter) / safeBefore) * 100))
    );
  }

  /**
   * Format carbon value for display.
   */
  static formatCarbon(grams: number): string {
    const safeGrams = clampFinite(grams);
    if (safeGrams < 1) {
      return `${(safeGrams * 1000).toFixed(1)} mg CO2`;
    }
    if (safeGrams < 1000) {
      return `${safeGrams.toFixed(2)} g CO2`;
    }
    return `${(safeGrams / 1000).toFixed(2)} kg CO2`;
  }

  /**
   * Get comprehensive display string with all comparisons.
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
