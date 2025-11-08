import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Radio, RefreshCw, Play, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const Vibes = () => {
  const [currentMood, setCurrentMood] = useState("Calm");
  const [loading, setLoading] = useState(true);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [recommendedPodcasts, setRecommendedPodcasts] = useState([]);

  useEffect(() => {
    fetchUserMood();
  }, []);

  const fetchUserMood = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: tones, error } = await supabase
        .from('chat_tone_analysis')
        .select('detected_tone')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (tones && tones.length > 0) {
        const mood = tones[0].detected_tone;
        setCurrentMood(mood);
        await generateRecommendations(mood);
      } else {
        await generateRecommendations('Calm');
      }
    } catch (error) {
      console.error('Error fetching mood:', error);
      await generateRecommendations('Calm');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async (mood) => {
    try {
      const musicPrompt = `List 6 real popular songs perfect for someone feeling ${mood}. Format: "Song Title" by Artist Name. Only list real, well-known songs.`;
      const podcastPrompt = `List 4 real popular mental health/wellness podcasts for someone feeling ${mood}. Format: Title | Brief description (10 words) | Duration. Only list real podcasts.`;

      const [musicResponse, podcastResponse] = await Promise.all([
        groq.chat.completions.create({
          messages: [{ role: "user", content: musicPrompt }],
          model: "llama-3.1-8b-instant",
          temperature: 0.7,
          max_tokens: 300,
        }),
        groq.chat.completions.create({
          messages: [{ role: "user", content: podcastPrompt }],
          model: "llama-3.1-8b-instant",
          temperature: 0.7,
          max_tokens: 300,
        }),
      ]);

      const musicText = musicResponse.choices[0]?.message?.content || "";
      const podcastText = podcastResponse.choices[0]?.message?.content || "";

      const songs = musicText.split('\n').filter(line => line.trim() && line.includes('by')).slice(0, 6).map(line => {
        const match = line.match(/["']?(.+?)["']?\s+by\s+(.+)/i);
        if (match) {
          return { title: match[1].replace(/^\d+\.\s*/, '').trim(), artist: match[2].trim(), mood };
        }
        const parts = line.replace(/^\d+\.\s*/, '').split(' by ');
        return { title: parts[0]?.trim() || 'Unknown', artist: parts[1]?.trim() || 'Unknown', mood };
      });

      const podcasts = podcastText.split('\n').filter(line => line.trim() && line.includes('|')).slice(0, 4).map(line => {
        const parts = line.replace(/^\d+\.\s*/, '').split('|').map(p => p.trim());
        return {
          title: parts[0] || 'Wellness Podcast',
          description: parts[1] || 'Mental health and wellness',
          duration: parts[2] || '25 min',
        };
      });

      setRecommendedSongs(songs.length > 0 ? songs : [{ title: 'Calm Vibes', artist: 'Peaceful Sounds', mood }]);
      setRecommendedPodcasts(podcasts.length > 0 ? podcasts : [{ title: 'Mindful Living', description: 'Mental wellness podcast', duration: '25 min' }]);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setRecommendedSongs([{ title: 'Calm Vibes', artist: 'Peaceful Sounds', mood }]);
      setRecommendedPodcasts([{ title: 'Mindful Living', description: 'Mental wellness podcast', duration: '25 min' }]);
    }
  };

  const refreshRecommendations = () => {
    setLoading(true);
    fetchUserMood();
  };

  const playOnYouTube = (title, artist) => {
    const query = encodeURIComponent(`${title} ${artist}`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  const searchPodcast = (title) => {
    const query = encodeURIComponent(title);
    window.open(`https://www.youtube.com/results?search_query=${query}+podcast`, '_blank');
  };

  return (
    <div className="min-h-screen gradient-calm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Your Vibes
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            You seem {currentMood.toLowerCase()} today — here's something that fits your vibe
          </p>
        </div>

        <Tabs defaultValue="music" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="music" className="gap-2">
              <Music className="h-4 w-4" />
              Music
            </TabsTrigger>
            <TabsTrigger value="podcasts" className="gap-2">
              <Radio className="h-4 w-4" />
              Podcasts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Recommended for You</h2>
              <Button variant="outline" className="gap-2" onClick={refreshRecommendations}>
                <RefreshCw className="h-4 w-4" />
                Refresh Playlist
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <p className="text-muted-foreground">Loading recommendations...</p>
              ) : (
                recommendedSongs.map((song, index) => (
                <Card
                  key={index}
                  className="glass-card border-border shadow-card hover:shadow-lg transition-smooth cursor-pointer group"
                  onClick={() => playOnYouTube(song.title, song.artist)}
                >
                  <CardHeader>
                    <div className="w-full aspect-square rounded-lg gradient-primary mb-4 flex items-center justify-center glow-primary">
                      <Music className="h-16 w-16 text-white opacity-80 group-hover:scale-110 transition-smooth" />
                    </div>
                    <CardTitle className="text-lg">{song.title}</CardTitle>
                    <CardDescription>{song.artist}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                        {song.mood}
                      </span>
                      <Button size="icon" variant="ghost" className="rounded-full">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="podcasts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Wellness Podcasts</h2>
              <Button variant="outline" className="gap-2" onClick={refreshRecommendations}>
                <RefreshCw className="h-4 w-4" />
                Discover More
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <p className="text-muted-foreground">Loading recommendations...</p>
              ) : (
                recommendedPodcasts.map((podcast, index) => (
                <Card
                  key={index}
                  className="glass-card border-border shadow-card hover:shadow-lg transition-smooth cursor-pointer"
                  onClick={() => searchPodcast(podcast.title)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl gradient-secondary flex items-center justify-center glow-secondary shrink-0">
                        <Radio className="h-10 w-10 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{podcast.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {podcast.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{podcast.duration}</span>
                      <Button size="sm" className="gradient-primary text-white hover:opacity-90 transition-smooth">
                        <Play className="mr-2 h-4 w-4" />
                        Listen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Vibes;
