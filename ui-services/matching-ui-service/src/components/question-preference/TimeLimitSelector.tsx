import React from "react";

interface TimeLimitSelectorProps {
  timeMin: number;
  timeMax: number;
  setTimeMin: React.Dispatch<React.SetStateAction<number>>;
  setTimeMax: React.Dispatch<React.SetStateAction<number>>;
}

const generateTimeOptions = () => {
  const options = [];
  // Loop from 10 minutes to 120 minutes (2 hours)
  for (let minutes = 10; minutes <= 120; minutes += 5) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const timeString =
      hours > 0
        ? `${hours}h ${remainingMinutes.toString().padStart(2, "0")}m`
        : `${remainingMinutes}m`;
    options.push(
      // The value of the option is a number
      <option key={minutes} value={minutes}>
        {timeString}
      </option>,
    );
  }
  return options;
};

const TimeLimitSelector: React.FC<TimeLimitSelectorProps> = ({
  timeMin,
  timeMax,
  setTimeMin,
  setTimeMax,
}) => {
  const timeOptions = generateTimeOptions();

  const handleSetTimeMax = (newTimeMax: number) => {
    if (newTimeMax < timeMin) {
      setTimeMin(newTimeMax);
    }
    setTimeMax(newTimeMax);
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold mb-2">Time Limit</h2>
      <div className="text-sm mb-2">Min: 10m &nbsp; Max: 2h</div>
      <div className="flex items-start gap-2 justify-start">
        <select
          value={timeMin}
          onChange={(e) => setTimeMin(Number(e.target.value))}
          className="w-24 bg-white border border-gray-300 rounded-md py-2 px-3 text-black"
        >
          {timeOptions}
        </select>
        <span className="text-lg text-black">-</span>
        <select
          value={timeMax}
          onChange={(e) => handleSetTimeMax(Number(e.target.value))}
          className="w-24 bg-white border border-gray-300 rounded-md py-2 px-3 text-black"
        >
          {timeOptions}
        </select>
      </div>
    </div>
  );
};

export default TimeLimitSelector;
