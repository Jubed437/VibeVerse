import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, Clock, Brain, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Insights = () => {
  const [insights, setInsights] = useState({
    happiestDay: "N/A",
    stressPeakTime: "N/A",
    dominantMood: "N/A",
    moodStreak: 0,
    weeklyAverage: "N/A"
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [timePatterns, setTimePatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState("");
  const [weeklySummary, setWeeklySummary] = useState({ positive: [], watch: [], recommendations: [] });

  const moodScores = { happy: 9, excited: 8, calm: 7, neutral: 5, tired: 4, sad: 3, anxious: 3, angry: 2 };
  const moodEmojis = { happy: "😊", calm: "😌", sad: "😔", anxious: "😰", excited: "🤩", tired: "😴", angry: "😤", neutral: "😐" };

  useEffect(() => {
    const loadData = async () => {
      const moods = await fetchInsights();
      const tones = await fetchChatTones();
      if (moods && moods.length > 0) {
        generateAISummary(moods, tones);
      }
    };
    loadData();
  }, []);

  const generateAISummary = async (moods, tones) => {
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) return;

      const moodSummary = moods.slice(0, 10).map(m => m.mood).join(', ');
      const toneSummary = tones.slice(0, 10).map(t => t.detected_tone).join(', ');
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are an emotional wellness analyst. Generate a brief 2-3 sentence behavioral summary based on mood and chat tone data. Be supportive and insightful.'
            },
            {
              role: 'user',
              content: `Recent moods: ${moodSummary}. Recent chat tones: ${toneSummary}. Provide a short behavioral insight.`
            }
          ],
          temperature: 0.7,
          max_tokens: 100
        })
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setAiSummary(data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating AI summary:', error);
    }
  };

  const fetchChatTones = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return [];

      const { data: tones, error } = await supabase
        .from('chat_tone_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (tones && tones.length > 0) {
        const toneCount = {};
        tones.forEach(t => {
          toneCount[t.detected_tone] = (toneCount[t.detected_tone] || 0) + 1;
        });
        const topTone = Object.entries(toneCount).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (topTone) {
          setInsights(prev => ({ ...prev, chatTone: topTone }));
        }
      }
      return tones || [];
    } catch (error) {
      console.error('Error fetching chat tones:', error);
      return [];
    }
  };

  const fetchInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: moods, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!moods || moods.length === 0) {
        setLoading(false);
        return [];
      }

      // Calculate insights
      const dayCount = {};
      const dayScores = {};
      const hourCount = {};
      const moodCount = {};

      moods.forEach(entry => {
        const date = new Date(entry.created_at);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const hour = date.getHours();
        const mood = entry.mood;
        const score = moodScores[mood] || 5;

        // Day analysis
        dayCount[day] = (dayCount[day] || 0) + 1;
        dayScores[day] = (dayScores[day] || 0) + score;

        // Hour analysis
        hourCount[hour] = (hourCount[hour] || 0) + 1;

        // Mood frequency
        moodCount[mood] = (moodCount[mood] || 0) + 1;
      });

      // Happiest day
      const happiestDay = Object.entries(dayScores)
        .map(([day, total]) => ({ day, avg: total / dayCount[day] }))
        .sort((a, b) => b.avg - a.avg)[0]?.day || "N/A";

      // Stress peak time
      const peakHour = Object.entries(hourCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      const stressPeakTime = peakHour !== "N/A" ? `${peakHour}:00` : "N/A";

      // Dominant mood
      const dominantMoodKey = Object.entries(moodCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";
      const dominantMood = `${dominantMoodKey.charAt(0).toUpperCase() + dominantMoodKey.slice(1)} ${moodEmojis[dominantMoodKey] || ""}`;

      // Streak calculation
      const sortedMoods = [...moods].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      let streak = 0;
      let lastDate = null;
      for (const entry of sortedMoods) {
        const entryDate = new Date(entry.created_at).toDateString();
        if (!lastDate) {
          streak = 1;
          lastDate = entryDate;
        } else {
          const dayDiff = (new Date(lastDate) - new Date(entryDate)) / (1000 * 60 * 60 * 24);
          if (dayDiff <= 1) {
            streak++;
            lastDate = entryDate;
          } else {
            break;
          }
        }
      }

      setInsights({
        happiestDay,
        stressPeakTime,
        dominantMood,
        moodStreak: streak,
        weeklyAverage: "Positive"
      });

      // Generate dynamic weekly summary
      const recentMoods = moods.slice(0, 7);
      const olderMoods = moods.slice(7, 14);
      const recentAvg = recentMoods.reduce((sum, m) => sum + (moodScores[m.mood] || 5), 0) / recentMoods.length;
      const olderAvg = olderMoods.length > 0 ? olderMoods.reduce((sum, m) => sum + (moodScores[m.mood] || 5), 0) / olderMoods.length : recentAvg;
      const moodChange = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);

      const happyDays = recentMoods.filter(m => ['happy', 'excited', 'calm'].includes(m.mood)).length;
      const stressfulDays = recentMoods.filter(m => ['anxious', 'angry', 'sad'].includes(m.mood)).length;

      const morningMoods = moods.filter(m => new Date(m.created_at).getHours() < 12);
      const morningPositive = morningMoods.filter(m => ['happy', 'excited', 'calm'].includes(m.mood)).length;
      const morningRatio = morningMoods.length > 0 ? (morningPositive / morningMoods.length) * 100 : 0;

      const eveningMoods = moods.filter(m => {
        const hour = new Date(m.created_at).getHours();
        return hour >= 18 && hour < 22;
      });
      const eveningStress = eveningMoods.filter(m => ['anxious', 'angry', 'sad', 'tired'].includes(m.mood)).length;
      const eveningStressRatio = eveningMoods.length > 0 ? (eveningStress / eveningMoods.length) * 100 : 0;

      const worstDay = Object.entries(dayScores)
        .map(([day, total]) => ({ day, avg: total / dayCount[day] }))
        .sort((a, b) => a.avg - b.avg)[0]?.day || "N/A";

      const positive = [];
      const watch = [];
      const recommendations = [];

      if (moodChange > 0) {
        positive.push(`Your mood improved by ${Math.abs(moodChange)}% this week`);
      } else if (moodChange < 0) {
        watch.push(`Your mood decreased by ${Math.abs(moodChange)}% this week`);
      } else {
        positive.push(`Your mood remained stable this week`);
      }

      if (happyDays >= 3) {
        positive.push(`You had ${happyDays} positive mood days`);
      } else if (stressfulDays >= 3) {
        watch.push(`You experienced ${stressfulDays} stressful days`);
      }

      if (morningRatio >= 70) {
        positive.push(`Morning check-ins show ${Math.round(morningRatio)}% positivity`);
      } else if (morningRatio < 50 && morningMoods.length > 0) {
        watch.push(`Morning moods need attention (${Math.round(morningRatio)}% positive)`);
      }

      if (insights.chatTone) {
        positive.push(`Chat conversations show mostly ${insights.chatTone} tone`);
      }

      if (streak >= 7) {
        positive.push(`Maintained ${streak}-day check-in streak`);
      }

      if (eveningStressRatio >= 50) {
        watch.push(`Evening stress levels are elevated (${Math.round(eveningStressRatio)}%)`);
        recommendations.push(`Consider relaxation techniques before 8 PM`);
      }

      if (worstDay !== "N/A") {
        watch.push(`${worstDay} shows consistent stress patterns`);
        recommendations.push(`Schedule relaxing activities on ${worstDay} evenings`);
      }

      if (happiestDay !== "N/A") {
        recommendations.push(`Your ${happiestDay} routine seems to work well - replicate it`);
      }

      if (eveningStressRatio >= 40) {
        recommendations.push(`Try evening meditation to reduce stress peaks`);
      }

      if (positive.length === 0) positive.push(`Keep tracking to identify positive patterns`);
      if (watch.length === 0) watch.push(`No major concerns detected this week`);
      if (recommendations.length === 0) recommendations.push(`Continue your current wellness routine`);

      setWeeklySummary({ positive, watch, recommendations });

      // Weekly data with actual moods per day
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayMoods = {};
      
      moods.forEach(entry => {
        const date = new Date(entry.created_at);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (!dayMoods[day]) dayMoods[day] = [];
        dayMoods[day].push(entry.mood);
      });
      
      const weekly = days.map(day => {
        const count = dayCount[day] || 0;
        const avgScore = count > 0 ? Math.round(dayScores[day] / count) : 0;
        
        // Get most common mood for this specific day
        const dayMoodList = dayMoods[day] || [];
        const dayMoodCount = {};
        dayMoodList.forEach(m => {
          dayMoodCount[m] = (dayMoodCount[m] || 0) + 1;
        });
        const topDayMood = Object.entries(dayMoodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
        
        return { 
          day, 
          mood: topDayMood.charAt(0).toUpperCase() + topDayMood.slice(1), 
          score: avgScore,
          emoji: moodEmojis[topDayMood] || '😐'
        };
      });
      setWeeklyData(weekly);

      // Time patterns
      const timeRanges = [
        { time: "Morning (6-12)", start: 6, end: 12 },
        { time: "Afternoon (12-6)", start: 12, end: 18 },
        { time: "Evening (6-10)", start: 18, end: 22 },
        { time: "Night (10-2)", start: 22, end: 26 }
      ];

      const patterns = timeRanges.map(range => {
        const count = Object.entries(hourCount)
          .filter(([hour]) => {
            const h = parseInt(hour);
            return h >= range.start && h < range.end;
          })
          .reduce((sum, [, cnt]) => sum + cnt, 0);
        const frequency = moods.length > 0 ? Math.round((count / moods.length) * 100) : 0;
        return { ...range, frequency, mood: "Varied" };
      });
      setTimePatterns(patterns);

      return moods;
    } catch (error) {
      console.error('Error fetching insights:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-calm p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading insights...</p>
      </div>
    );
  }

  if (weeklyData.length === 0) {
    return (
      <div className="min-h-screen gradient-calm p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Mood Insights</h1>
          </div>
          <Card className="glass-card p-12 text-center">
            <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Data Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start tracking your moods to see personalized insights and patterns.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-calm p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mood Insights</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Happiest Day</p>
            </div>
            <p className="text-2xl font-bold">{insights.happiestDay}</p>
            <p className="text-xs text-muted-foreground mt-1">You feel best mid-week</p>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-secondary" />
              <p className="text-sm text-muted-foreground">Stress Peak</p>
            </div>
            <p className="text-2xl font-bold">{insights.stressPeakTime}</p>
            <p className="text-xs text-muted-foreground mt-1">Evening stress pattern</p>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <p className="text-sm text-muted-foreground">Dominant Mood</p>
            </div>
            <p className="text-2xl font-bold">{insights.dominantMood}</p>
            <p className="text-xs text-muted-foreground mt-1">Most common this week</p>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <p className="text-sm text-muted-foreground">Check-in Streak</p>
            </div>
            <p className="text-2xl font-bold">{insights.moodStreak} days</p>
            <p className="text-xs text-muted-foreground mt-1">Keep it going! 🔥</p>
          </Card>
        </div>

        <Card className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Weekly Mood Pattern</h2>
          <div className="space-y-3">
            {weeklyData.map((day, index) => (
              <div 
                key={day.day} 
                className="flex items-center gap-4 group hover:scale-[1.02] transition-transform duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="w-12 text-sm font-medium">{day.day}</span>
                <div className="flex-1 bg-muted rounded-full h-10 relative overflow-hidden shadow-inner">
                  <div
                    className="h-full gradient-primary rounded-full flex items-center justify-between px-4 text-white text-sm font-medium transition-all duration-700 ease-out group-hover:brightness-110"
                    style={{ 
                      width: day.score > 0 ? `${(day.score / 10) * 100}%` : '5%',
                      background: day.score >= 7 ? 'linear-gradient(90deg, #10b981, #34d399)' : 
                                 day.score >= 5 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 
                                 'linear-gradient(90deg, #ef4444, #f87171)'
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{day.emoji}</span>
                      <span>{day.mood}</span>
                    </span>
                  </div>
                </div>
                <span className="w-16 text-sm font-semibold text-right">
                  {day.score > 0 ? `${day.score}/10` : 'No data'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Time-of-Day Patterns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timePatterns.map((pattern) => (
              <div key={pattern.time} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{pattern.time}</span>
                  <span className="text-sm text-muted-foreground">{pattern.frequency}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                    style={{ width: `${pattern.frequency}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Usually {pattern.mood}</p>
              </div>
            ))}
          </div>
        </Card>

        {aiSummary && (
          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">AI Behavioral Insights</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{aiSummary}</p>
          </Card>
        )}

        <Card className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Weekly Summary</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="font-medium text-green-700 dark:text-green-400">✨ Positive Trends</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {weeklySummary.positive.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="font-medium text-yellow-700 dark:text-yellow-400">⚠️ Areas to Watch</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {weeklySummary.watch.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="font-medium text-blue-700 dark:text-blue-400">💡 Recommendations</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {weeklySummary.recommendations.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
