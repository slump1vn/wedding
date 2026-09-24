import { useState, useEffect } from "react";

const eventDate = process.env.NEXT_PUBLIC_EVENT_DATE

const CountdownTimer = () => {
  const calculateTimeLeft = () => {
    const targetDate = new Date(eventDate || "2025-01-01T00:00:00");
    const now = new Date();
    const difference = Number(targetDate) - Number(now);

    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  const units = [
    { value: timeLeft.days, label: "Ngày" },
    { value: timeLeft.hours, label: "Giờ" },
    { value: timeLeft.minutes, label: "Phút" },
    { value: timeLeft.seconds, label: "Giây" },
  ];

  return (
    <div className="flex gap-2 font-quicksand">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex flex-col items-center justify-center bg-black/45 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[64px]"
        >
          <span className="text-2xl font-bold text-white">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="text-xs uppercase text-white/85">{u.label}</span>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
