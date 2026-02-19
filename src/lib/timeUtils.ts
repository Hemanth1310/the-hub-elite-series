/**
 * Format time remaining until deadline with smart display
 * 
 * Adapts format based on time remaining:
 * - > 7 days: "8 days"
 * - 2-7 days: "5d 12h"
 * - 1-2 days: "1d 14h"
 * - < 24h: "23h 45m"
 * - < 1h: "45m"
 * - < 1m: "< 1m"
 */
export const formatTimeRemaining = (deadline: Date): string => {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  
  // If deadline has passed
  if (diff <= 0) {
    return 'Closed';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  // More than 7 days: Just show days
  if (days > 7) {
    return `${days} days`;
  }
  
  // 2-7 days: Show days and hours
  if (days >= 2) {
    return `${days}d ${hours}h`;
  }
  
  // 1-2 days: Show days and hours
  if (days === 1) {
    return `1d ${hours}h`;
  }
  
  // Less than 24 hours: Show hours and minutes
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  // Less than 1 hour: Show just minutes
  if (minutes > 0) {
    return `${minutes}m`;
  }
  
  // Less than 1 minute
  return '< 1m';
};

/**
 * Get time components for more control
 */
export const getTimeRemaining = (deadline: Date) => {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, expired: false };
};

/**
 * Format time remaining for compact display (e.g., dashboard cards)
 * Always 2 units max
 */
export const formatTimeRemainingCompact = (deadline: Date): string => {
  const { days, hours, minutes, expired } = getTimeRemaining(deadline);
  
  if (expired) return 'Closed';
  
  // More than 1 day
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  
  // Less than 1 day
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  // Less than 1 hour
  if (minutes > 0) {
    return `${minutes}m`;
  }
  
  return '< 1m';
};

/**
 * Get urgency level for styling
 */
export const getTimeUrgency = (deadline: Date): 'safe' | 'warning' | 'urgent' | 'critical' => {
  const { days, hours, minutes, expired } = getTimeRemaining(deadline);
  
  if (expired) return 'critical';
  
  // More than 1 day - safe
  if (days > 1) return 'safe';
  
  // 6-24 hours - warning
  if (days === 1 || hours >= 6) return 'warning';
  
  // 1-6 hours - urgent
  if (hours >= 1) return 'urgent';
  
  // Less than 1 hour - critical
  return 'critical';
};
