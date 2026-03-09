import { useEffect, useState } from "react";
import moment from "moment";

export default function RelativeTime({ date }) {
  const [, setRefresh] = useState(0);

  if (!date) return null;

  // Refresh every minute to keep relative time current
  useEffect(() => {
    const interval = setInterval(() => setRefresh(prev => prev + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Ensure the date is parsed as UTC then converted to local
  const localTime = moment.utc(date).local();

  return (
    <span title={localTime.format("YYYY-MM-DD HH:mm:ss")}>
      {localTime.fromNow()}
    </span>
  );
}