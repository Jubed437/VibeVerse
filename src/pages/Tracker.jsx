import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Sparkles } from "lucide-react";
import InsightCard from "@/components/InsightCard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import MoodSelector from "@/components/MoodSelector";

const moodColors = {
  happy: "hsl(48, 96%, 53%)",
  calm: "hsl(220, 80%, 60%)",
  sad: "hsl(270, 50%, 50%)",
  anxious: "hsl(0, 70%, 60%)",
  neutral: "hsl(0, 0%, 60%)",
  excited: "hsl(30, 100%, 50%)",
  angry: "hsl(0, 80%, 50%)",
  tired: "hsl(200, 20%, 50%)"
};

const moodScores = {
  happy: 9,
  excited: 8,
  calm: 7,
  neutral: 5,
  tired: 4,
  sad: 3,
  anxious: 3,
  angry: 2
};

const Tracker = () => {
  const [timeRange, setTimeRange] = useState("week");
  const [moodEntries, setMoodEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMoodEntries();
    fetchChatTones();
  }, [timeRange]);

  const [chatTones, setChatTones] = useState([]);

  const fetchChatTones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate = new Date();
      if (timeRange === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === "month") {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const { data } = await supabase
        .from('chat_tone_analysis')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      setChatTones(data || []);
    } catch (error) {
      console.error('Error fetching chat tones:', error);
    }
  };

  const fetchMoodEntries = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      let startDate = new Date();
      if (timeRange === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === "month") {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMoodEntries(data || []);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = async (mood) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood: mood.toLowerCase(),
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Mood Logged!",
        description: `You're feeling ${mood} today`
      });

      setShowMoodSelector(false);
      fetchMoodEntries();
    } catch (error) {
      console.error('Error logging mood:', error);
      toast({
        title: "Error",
        description: "Failed to log mood",
        variant: "destructive"
      });
    }
  };

  const getMoodTrendData = () => {
    if (moodEntries.length === 0) return [];
    
    const grouped = {};
    moodEntries.forEach(entry => {
      const date = new Date(entry.created_at);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      const score = moodScores[entry.mood] || 5;
      
      if (!grouped[day]) {
        grouped[day] = { day, total: 0, count: 0 };
      }
      grouped[day].total += score;
      grouped[day].count += 1;
    });

    return Object.values(grouped).map(g => ({
      day: g.day,
      score: Math.round(g.total / g.count)
    }));
  };

  const getEmotionDistribution = () => {
    const counts = {};
    
    moodEntries.forEach(entry => {
      counts[entry.mood] = (counts[entry.mood] || 0) + 1;
    });
    
    chatTones.forEach(tone => {
      const mood = tone.detected_tone.toLowerCase();
      counts[mood] = (counts[mood] || 0) + 1;
    });

    if (Object.keys(counts).length === 0) return [];

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: moodColors[name] || "hsl(0, 0%, 60%)"
    }));
  };

  const getIntensityData = () => {
    if (moodEntries.length === 0) return [];
    
    const recent = moodEntries.slice(-5);
    return recent.map(entry => ({
      emotion: entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1),
      intensity: moodScores[entry.mood] || 5
    }));
  };

  const moodTrendData = getMoodTrendData();
  const emotionDistribution = getEmotionDistribution();
  const intensityData = getIntensityData();

  return (
    <div className="min-h-screen gradient-calm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mood Tracker & Insights
          </h1>
          <p className="text-muted-foreground">Visualize your emotional patterns and growth</p>
        </div>

        {/* AI Summary */}
        <div className="mb-8">
          <InsightCard
            title="Weekly Summary"
            description={`You've been happiest on weekends! Your overall mood has improved by 12% this week.${chatTones.length > 0 ? ` Chat analysis shows ${chatTones.length} emotional check-ins.` : ''} Keep doing what brings you joy.`}
            icon={<Sparkles className="h-6 w-6 text-white" />}
          />
        </div>

        {/* Time Range Selector */}
        <Tabs defaultValue="week" className="mb-6" onValueChange={setTimeRange}>
          <TabsList className="glass-card">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>

          <TabsContent value={timeRange} className="space-y-6 mt-6">
            {/* Mood Trend Chart */}
            <Card className="glass-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Mood Trend Over Time</CardTitle>
                <CardDescription>Track how your mood changes day by day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={moodTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Emotion Distribution */}
              <Card className="glass-card border-border shadow-card">
                <CardHeader>
                  <CardTitle>Emotion Distribution</CardTitle>
                  <CardDescription>Breakdown of your emotional states</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={emotionDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {emotionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Intensity Chart */}
              <Card className="glass-card border-border shadow-card">
                <CardHeader>
                  <CardTitle>Emotional Intensity</CardTitle>
                  <CardDescription>How strongly you feel each emotion</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={intensityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="emotion" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                      />
                      <Bar dataKey="intensity" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Entry Button */}
        <div className="flex justify-center mt-8">
          <Button 
            onClick={() => setShowMoodSelector(true)}
            className="gradient-primary text-white glow-primary hover:opacity-90 transition-smooth"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Mood Entry
          </Button>
        </div>

        {/* Mood Selector Modal */}
        {showMoodSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMoodSelector(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <MoodSelector onMoodSelect={handleMoodSelect} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracker;
