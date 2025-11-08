import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, Users, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Community = () => {
  const { toast } = useToast();
  const [showShareForm, setShowShareForm] = useState(false);
  const [newStory, setNewStory] = useState("");
  const [selectedMood, setSelectedMood] = useState("calm");
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('community_stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (storyId, currentLikes) => {
    try {
      const { error } = await supabase
        .from('community_stories')
        .update({ likes: currentLikes + 1 })
        .eq('id', storyId);

      if (error) throw error;
      fetchStories();
    } catch (error) {
      console.error('Error liking story:', error);
      toast({ title: "Error", description: "Failed to like story", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (!newStory.trim()) {
      toast({ title: "Story is empty", description: "Please write something to share", variant: "destructive" });
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const { error } = await supabase
        .from('community_stories')
        .insert({
          user_id: user?.id || null,
          mood: selectedMood,
          story: newStory,
          likes: 0
        });

      if (error) throw error;

      toast({ title: "Story Shared! 🎉", description: "Your anonymous story has been shared with the community" });
      setNewStory("");
      setShowShareForm(false);
      fetchStories();
    } catch (error) {
      console.error('Error sharing story:', error);
      toast({ title: "Error", description: "Failed to share story", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen gradient-calm p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Community Stories</h1>
              <p className="text-sm text-muted-foreground">You're not alone in this journey</p>
            </div>
          </div>
          <Button
            onClick={() => setShowShareForm(!showShareForm)}
            className="gradient-primary text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Share Your Story
          </Button>
        </div>

        <Card className="glass-card p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Safe Space Guidelines</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All stories are completely anonymous</li>
                <li>• Be kind, supportive, and respectful</li>
                <li>• Share your experiences, not advice (unless asked)</li>
                <li>• If you're in crisis, please contact a professional</li>
              </ul>
            </div>
          </div>
        </Card>

        {showShareForm && (
          <Card className="glass-card p-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-lg mb-4">Share Your Story Anonymously</h3>
            <select 
              value={selectedMood} 
              onChange={(e) => setSelectedMood(e.target.value)}
              className="mb-3 p-2 rounded border bg-background"
            >
              <option value="happy">😊 Happy</option>
              <option value="calm">😌 Calm</option>
              <option value="sad">😔 Sad</option>
              <option value="anxious">😰 Anxious</option>
              <option value="stressed">😫 Stressed</option>
            </select>
            <Textarea
              value={newStory}
              onChange={(e) => setNewStory(e.target.value)}
              placeholder="Share your experience, feelings, or journey... Your story might help someone else feel less alone."
              className="min-h-32 mb-4"
            />
            <div className="flex gap-3">
              <Button onClick={handleShare} className="gradient-primary text-white">
                Share Anonymously
              </Button>
              <Button onClick={() => setShowShareForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading stories...</p>
          ) : stories.length === 0 ? (
            <Card className="glass-card p-6 text-center">
              <p className="text-muted-foreground">No stories yet. Be the first to share!</p>
            </Card>
          ) : (
            stories.map((story) => {
              const moodEmojis = { happy: "😊", calm: "😌", sad: "😔", anxious: "😰", stressed: "😫" };
              const timeAgo = new Date(story.created_at).toLocaleDateString();
              
              return (
                <Card key={story.id} className="glass-card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">Anonymous</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{timeAgo}</span>
                        <span className="ml-auto px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          {moodEmojis[story.mood]} {story.mood}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed mb-4">{story.story}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button 
                          onClick={() => handleLike(story.id, story.likes)}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <Heart className="h-4 w-4" />
                          <span>{story.likes}</span>
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(story.story);
                            toast({ title: "Copied!", description: "Story copied to clipboard" });
                          }}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <Card className="glass-card p-6 text-center">
          <p className="text-muted-foreground mb-4">
            You've reached the end. Check back later for more stories.
          </p>
          <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to Top
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Community;
