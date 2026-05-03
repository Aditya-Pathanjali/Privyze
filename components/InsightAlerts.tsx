export interface InsightAlert {
  id: string;
  emoji: string;
  message: string;
  type: 'danger' | 'warning' | 'info' | 'success';
}

interface InsightAlertsProps {
  trackerCount: number;
  domainCount: number;
  carbonGrams: number;
  privacyScore: number;
  healthAlert: boolean;
  sessionActive: boolean;
}

export function generateInsightAlerts(props: InsightAlertsProps): InsightAlert[] {
  const alerts: InsightAlert[] = [];

  if (!props.sessionActive) {
    return alerts;
  }

  if (props.trackerCount > 0) {
    alerts.push({
      id: 'trackers',
      emoji: '!',
      message: `${props.trackerCount} tracker${props.trackerCount > 1 ? 's' : ''} detected - your browsing is being monitored`,
      type: 'danger',
    });
  }

  if (props.trackerCount > 3) {
    alerts.push({
      id: 'ad-networks',
      emoji: 'AD',
      message: 'Your data is being sent to advertising networks for profile building',
      type: 'warning',
    });
  }

  if (props.carbonGrams > 0.5) {
    alerts.push({
      id: 'carbon',
      emoji: 'CO2',
      message: `High carbon footprint detected - ${props.carbonGrams.toFixed(2)}g CO2 from this page alone`,
      type: 'warning',
    });
  }

  if (props.healthAlert) {
    alerts.push({
      id: 'health',
      emoji: '+',
      message: 'Sensitive health data detected - enhanced privacy protections activated',
      type: 'danger',
    });
  }

  if (props.privacyScore < 40) {
    alerts.push({
      id: 'risky',
      emoji: '!',
      message: `Privacy score is critically low (${props.privacyScore}/100) - immediate action recommended`,
      type: 'danger',
    });
  }

  if (props.domainCount > 15) {
    alerts.push({
      id: 'domains',
      emoji: 'NET',
      message: `${props.domainCount} external domains contacted - your data is widely shared`,
      type: 'info',
    });
  }

  return alerts;
}
