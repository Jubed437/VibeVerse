import { Button } from "@/components/ui/button";
import MoodSelector from "@/components/MoodSelector";
import InsightCard from "@/components/InsightCard";
import { MessageCircle, BarChart3, Music, BookOpen, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState("Calm");
  const { profile, getPersonalizedGreeting, getPersonalizedContent } = useUserProfile();
  const content = getPersonalizedContent();
  const [greeting, setGreeting] = useState("");
  const [stats, setStats] = useState({ moodCount: 0, journalCount: 0, improvement: 0 });
  const { toast } = useToast();
  
  useEffect(() => {
    setGreeting(getPersonalizedGreeting());
    fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [moodData, journalData] = await Promise.all([
        supabase.from('mood_entries').select('mood', { count: 'exact' }).eq('user_id', user.id).gte('created_at', weekAgo.toISOString()),
        supabase.from('journal_entries').select('id', { count: 'exact' }).eq('user_id', user.id)
      ]);

      if (moodData.error) throw moodData.error;
      if (journalData.error) throw journalData.error;

      const moodScores = { happy: 9, excited: 8, calm: 7, neutral: 5, tired: 4, sad: 3, anxious: 3, angry: 2 };
      const moods = moodData.data || [];
      const avgScore = moods.length > 0 ? moods.reduce((sum, m) => sum + (moodScores[m.mood] || 5), 0) / moods.length : 0;
      const improvement = Math.round((avgScore / 9) * 100 - 85);

      setStats({
        moodCount: moods.length,
        journalCount: journalData.count || 0,
        improvement: improvement > 0 ? improvement : 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleMoodSelect = async (mood) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { error } = await supabase.from('mood_entries').insert({
        user_id: user.id,
        mood: mood.toLowerCase(),
        date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      setSelectedMood(mood);
      toast({ title: "Mood Logged!", description: `You're feeling ${mood} today` });
      fetchStats();
    } catch (error) {
      console.error('Error logging mood:', error);
      toast({ title: "Error", description: "Failed to log mood", variant: "destructive" });
    }
  };

  const quickActions = [
    { icon: MessageCircle, label: "Chat with Vibe", path: "/chat", color: "from-primary to-secondary" },
    { icon: BarChart3, label: "View Mood Trends", path: "/tracker", color: "from-secondary to-accent" },
    { icon: Music, label: "Explore Music", path: "/vibes", color: "from-accent to-primary" },
    { icon: BookOpen, label: "Write Journal", path: "/journal", color: "from-primary to-accent" },
  ];

  return (
    <div className="min-h-screen gradient-calm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Greeting Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {greeting || getPersonalizedGreeting()}
          </h1>
          <p className="text-xl text-muted-foreground">
            {profile?.communicationStyle === "Casual" 
              ? "What's your vibe today?" 
              : "How are you feeling today?"}
          </p>
        </div>

        {/* Mood Selector */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Select Your Current Mood
          </h2>
          <MoodSelector selectedMood={selectedMood} onMoodSelect={handleMoodSelect} />
        </div>

        {/* AI Summary Card */}
        <div className="mb-8">
          <InsightCard
            title="AI Insight"
            description={`You seem ${selectedMood.toLowerCase()} today. This is a great time to reflect on what brings you peace. Want a relaxing playlist?`}
            icon={<Sparkles className="h-6 w-6 text-white" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-br ${action.color} text-white hover:opacity-90 transition-smooth shadow-soft hover:shadow-card`}
              >
                <action.icon className="h-8 w-8" />
                <span className="font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Daily Reflection */}
        <div className="glass-card rounded-2xl p-6 shadow-card">
          <div className="flex items-start gap-4">
            <div className="gradient-primary p-3 rounded-xl glow-primary">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Daily AI Reflection</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {stats.moodCount > 0 
                  ? `Over the past week, you've logged ${stats.moodCount} mood entries and written ${stats.journalCount} journal entries. ${stats.improvement > 0 ? `Your mood has improved by ${stats.improvement}%. ` : ''}Keep nurturing your wellness journey.`
                  : "Start tracking your mood to see personalized insights and trends over time."}
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/tracker')}>
                View Full Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
