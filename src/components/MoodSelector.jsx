import { useState } from "react";

const moods = [
  { emoji: "😊", label: "Happy", color: "from-yellow-400 to-orange-400" },
  { emoji: "😌", label: "Calm", color: "from-blue-400 to-cyan-400" },
  { emoji: "😔", label: "Sad", color: "from-blue-500 to-purple-500" },
  { emoji: "😰", label: "Anxious", color: "from-red-400 to-pink-400" },
  { emoji: "😤", label: "Angry", color: "from-red-500 to-orange-500" },
  { emoji: "🤔", label: "Thoughtful", color: "from-purple-400 to-indigo-400" },
];

const MoodSelector = ({ selectedMood, onMoodSelect }) => {
  const [selected, setSelected] = useState(selectedMood || "");

  const handleSelect = (label) => {
    setSelected(label);
    onMoodSelect?.(label);
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {moods.map((mood) => (
        <button
          key={mood.label}
          onClick={() => handleSelect(mood.label)}
          className={`
            relative p-4 rounded-2xl transition-smooth
            glass-card hover:scale-105
            ${selected === mood.label ? 'ring-2 ring-primary glow-primary' : ''}
          `}
        >
          <div className={`text-4xl mb-2 ${selected === mood.label ? 'animate-pulse-glow' : ''}`}>
            {mood.emoji}
          </div>
          <p className="text-xs font-medium text-foreground">{mood.label}</p>
          {selected === mood.label && (
            <div className={`absolute inset-0 bg-gradient-to-br ${mood.color} opacity-10 rounded-2xl`} />
          )}
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;
