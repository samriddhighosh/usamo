import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

type ContestTimerProps = {
  endTime: string;
};

export default function ContestTimer({ endTime }: ContestTimerProps) {
  const end = useMemo(() => dayjs(endTime), [endTime]);
  const [remaining, setRemaining] = useState(() => end.diff(dayjs()));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(end.diff(dayjs()));
    }, 1000);
    return () => clearInterval(timer);
  }, [end]);

  return (
    <div className="ui-pill font-mono text-sm">
      {formatRemaining(remaining)}
    </div>
  );
}
