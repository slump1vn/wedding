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

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  return (
    <div className="flex space-x-4 mt-5 text-center font-legan">
      <div className="flex flex-col">
        <span className="text-5xl font-bold">{timeLeft.days}</span>
        <span className="text-base uppercase">Days</span>
      </div>
      <div className="flex flex-col">
        <span className="text-5xl font-bold">{timeLeft.hours}</span>
        <span className="text-base uppercase">Hours</span>
      </div>
      <div className="flex flex-col">
        <span className="text-5xl font-bold">{timeLeft.minutes}</span>
        <span className="text-base uppercase">Minutes</span>
      </div>
      <div className="flex flex-col">
        <span className="text-5xl font-bold">{timeLeft.seconds}</span>
        <span className="text-base uppercase">Seconds</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
