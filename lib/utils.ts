export function formatDistanceToNow(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (Math.abs(seconds) < 5) {
        return "just now";
    }
    
    const isPast = seconds > 0;
    const absSeconds = Math.abs(seconds);

    let interval = absSeconds / 31536000;
    if (interval > 1) {
      const count = Math.floor(interval);
      return `${count} year${count > 1 ? 's' : ''}${isPast ? ' ago' : ' from now'}`;
    }
    interval = absSeconds / 2592000;
    if (interval > 1) {
      const count = Math.floor(interval);
      return `${count} month${count > 1 ? 's' : ''}${isPast ? ' ago' : ' from now'}`;
    }
    interval = absSeconds / 86400;
    if (interval > 1) {
      const count = Math.floor(interval);
      return `${count} day${count > 1 ? 's' : ''}${isPast ? ' ago' : ' from now'}`;
    }
    interval = absSeconds / 3600;
    if (interval > 1) {
      const count = Math.floor(interval);
      return `${count} hour${count > 1 ? 's' : ''}${isPast ? ' ago' : ' from now'}`;
    }
    interval = absSeconds / 60;
    if (interval > 1) {
      const count = Math.floor(interval);
      return `${count} minute${count > 1 ? 's' : ''}${isPast ? ' ago' : ' from now'}`;
    }
    return `${Math.floor(absSeconds)} second${Math.floor(absSeconds) > 1 ? 's' : ''}${isPast ? ' ago' : ' from now'}`;
  } catch (e) {
      console.error("Could not parse date:", dateString);
      return '';
  }
}