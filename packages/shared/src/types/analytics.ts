export interface AnalyticsTotals {
  totalRegistered: number;
  totalCheckedIn: number;
  checkInRate: number; // 0-100
}

export interface TimelinePoint {
  label: string; // e.g. "Jan 5" or "9 AM"
  count: number;
}

export interface DistributionItem {
  label: string;
  count: number;
  percentage: number; // 0-100, of the relevant total
}

export interface EventAnalytics {
  totals: AnalyticsTotals;
  registrationTimeline: TimelinePoint[];
  checkInTimeline: TimelinePoint[];
  genderDistribution: DistributionItem[];
  countryDistribution: DistributionItem[];
  checkInMethodBreakdown: DistributionItem[];
}
