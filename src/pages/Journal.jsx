import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Sparkles, Save, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Journal = () => {
  const { toast } = useToast();
  const [entry, setEntry] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [date, setDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!entry.trim()) {
      toast({ title: "Empty Entry", description: "Please write something first", variant: "destructive" });
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          content: entry,
          mood: selectedMood || null
        });

      if (error) throw error;

      toast({ title: "Entry Saved", description: "Your journal entry has been saved successfully." });
      setEntry("");
      setSelectedMood("");
      fetchEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({ title: "Error", description: "Failed to save entry", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen gradient-calm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Journal
          </h1>
          <p className="text-muted-foreground">Your emotions are valid. Write them down.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Journal Editor */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-border shadow-card">
              <CardHeader>
                <CardTitle>New Entry</CardTitle>
                <CardDescription>Express your thoughts and feelings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Select value={selectedMood} onValueChange={setSelectedMood}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Mood Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="happy">😊 Happy</SelectItem>
                      <SelectItem value="calm">😌 Calm</SelectItem>
                      <SelectItem value="sad">😔 Sad</SelectItem>
                      <SelectItem value="anxious">😰 Anxious</SelectItem>
                      <SelectItem value="thoughtful">🤔 Thoughtful</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="gap-2" onClick={async () => {
                    if (!entry.trim()) {
                      toast({ title: "Empty Entry", description: "Write something first", variant: "destructive" });
                      return;
                    }
                    try {
                      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
                      if (!apiKey) throw new Error('API key missing');

                      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                          model: 'llama-3.1-8b-instant',
                          messages: [{ role: 'user', content: `Summarize this journal entry in 1-2 sentences:\n\n${entry}` }],
                          temperature: 0.5,
                          max_tokens: 100
                        })
                      });

                      if (!response.ok) throw new Error('API request failed');
                      const data = await response.json();
                      const summary = data.choices[0].message.content;
                      toast({ title: "AI Summary", description: summary });
                    } catch (error) {
                      console.error('AI summary error:', error);
                      toast({ title: "Error", description: "Failed to generate summary", variant: "destructive" });
                    }
                  }}>
                    <Sparkles className="h-4 w-4" />
                    Summarize with AI
                  </Button>
                </div>

                <Textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="How are you feeling today? What's on your mind?"
                  className="min-h-[400px] resize-none"
                />

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEntry("")}>
                    Clear
                  </Button>
                  <Button onClick={handleSave} className="gradient-primary text-white glow-primary hover:opacity-90 transition-smooth">
                    <Save className="mr-2 h-4 w-4" />
                    Save Entry
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Past Entries */}
            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-semibold">Past Entries</h2>
              
              {loading ? (
                <p className="text-muted-foreground">Loading entries...</p>
              ) : entries.length === 0 ? (
                <p className="text-muted-foreground">No entries yet. Start writing your first journal entry!</p>
              ) : (
                entries.map((e) => {
                  const moodEmojis = { happy: "😊", calm: "😌", sad: "😔", anxious: "😰", thoughtful: "🤔" };
                  const date = new Date(e.created_at);
                  const timeStr = date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                  
                  return (
                    <Card key={e.id} className="glass-card border-border shadow-soft hover:shadow-card transition-smooth cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{e.title || 'Journal Entry'}</CardTitle>
                          {e.mood && <span className="text-2xl">{moodEmojis[e.mood] || '📝'}</span>}
                        </div>
                        <CardDescription>{timeStr}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {e.content}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Calendar Sidebar */}
          <div>
            <Card className="glass-card border-border shadow-card sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Entry Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                />
                <div className="mt-6 p-4 rounded-lg gradient-card">
                  <p className="text-sm font-medium mb-2">Today's Affirmation</p>
                  <p className="text-sm text-muted-foreground italic">
                    "You are doing better than you think. Every step forward counts."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;
