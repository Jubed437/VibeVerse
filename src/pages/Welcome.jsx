import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sparkles, MessageCircle, BarChart3, Music, BookOpen, Brain, Heart, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Welcome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = ["Emotions", "Moods", "Thoughts", "Feelings", "Journey"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session check error:', error);
      }
      if (session) {
        navigate("/dashboard");
      }
      setLoading(false);
    });
  }, [navigate]);

  useEffect(() => {
    const word = words[currentWordIndex];
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= word.length) {
        setTypedText(word.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }, 2000);
      }
    }, 150);
    return () => clearInterval(typingInterval);
  }, [currentWordIndex]);

  if (loading) {
    return <div className="min-h-screen gradient-calm flex items-center justify-center">Loading...</div>;
  }

  const handleGetStarted = () => {
    // Go to auth page (login/signup)
    navigate("/auth");
  };

  const features = [
    { icon: MessageCircle, title: "AI Chat Companion", desc: "Voice-powered conversations with empathetic AI that understands your emotions" },
    { icon: BarChart3, title: "Mood Tracking", desc: "Visualize emotional patterns with beautiful charts and insights" },
    { icon: BookOpen, title: "Smart Journaling", desc: "AI-powered summaries and reflections on your daily thoughts" },
    { icon: Music, title: "Personalized Vibes", desc: "Music and podcast recommendations based on your current mood" },
    { icon: Brain, title: "AI Insights", desc: "Behavioral analysis and personalized wellness recommendations" },
    { icon: Heart, title: "Community Support", desc: "Share anonymous stories and connect with others on similar journeys" }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-calm" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-4xl">
            <div className="mb-8 inline-block animate-in fade-in slide-in-from-top duration-700">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center glow-primary animate-pulse-glow">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '100ms' }}>
              <span className="inline-block animate-gradient-x bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent bg-[length:200%_auto]">
                Welcome to VibeVerse
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-foreground mb-4 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '200ms' }}>
              Track Your{" "}
              <span className="inline-block min-w-[200px] text-left">
                <span className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {typedText}
                  <span className="animate-pulse">|</span>
                </span>
              </span>
            </p>
            
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '300ms' }}>
              Track your moods, chat with empathetic AI, discover personalized insights, and grow your emotional intelligence - all in one beautiful space.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '400ms' }}>
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="gradient-primary text-white glow-primary hover:opacity-90 transition-smooth text-lg px-10 py-6"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Your Journey
              </Button>
              <Button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 glass-card border-border hover:bg-primary/10"
              >
                Learn More
              </Button>
            </div>

            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground animate-in fade-in duration-700" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-secondary" />
                <span>100% Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" />
                <span>Science-Backed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="inline-block animate-gradient-x bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent bg-[length:200%_auto]">
                  Everything You Need for Emotional Wellness
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in duration-700">
                Powerful features designed to help you understand, track, and improve your emotional well-being
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="glass-card p-8 rounded-2xl border-border shadow-card hover:shadow-xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom group cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 glow-primary group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-20 px-6 bg-gradient-to-b from-transparent to-primary/5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-in fade-in duration-700">
                <span className="inline-block hover:scale-105 transition-transform duration-300">
                  How It Works
                </span>
              </h2>
              <p className="text-lg text-muted-foreground animate-in fade-in duration-700" style={{ animationDelay: '100ms' }}>
                Get started in minutes and begin your wellness journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group animate-in fade-in slide-in-from-left duration-700" style={{ animationDelay: '200ms' }}>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">Sign Up & Personalize</h3>
                <p className="text-muted-foreground">Create your account and tell us about your wellness goals</p>
              </div>
              <div className="text-center group animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: '300ms' }}>
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-secondary group-hover:scale-110 group-hover:bg-secondary/30 transition-all duration-300">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-secondary transition-colors duration-300">Track & Reflect</h3>
                <p className="text-muted-foreground">Log your moods, chat with AI, and journal your thoughts</p>
              </div>
              <div className="text-center group animate-in fade-in slide-in-from-right duration-700" style={{ animationDelay: '400ms' }}>
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent group-hover:scale-110 group-hover:bg-accent/30 transition-all duration-300">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors duration-300">Grow & Thrive</h3>
                <p className="text-muted-foreground">Get AI insights and watch your emotional intelligence grow</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-card p-12 rounded-3xl border-border shadow-card hover:shadow-xl transition-all duration-500 animate-in fade-in zoom-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="inline-block animate-gradient-x bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent bg-[length:200%_auto]">
                  Ready to Transform Your Emotional Wellness?
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 animate-in fade-in duration-700" style={{ animationDelay: '100ms' }}>
                Join thousands discovering better emotional health with AI-powered insights
              </p>
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="gradient-primary text-white glow-primary hover:opacity-90 hover:scale-105 transition-all duration-300 text-lg px-12 py-6 animate-in fade-in slide-in-from-bottom duration-700"
                style={{ animationDelay: '200ms' }}
              >
                <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                Get Started Free
              </Button>
              <p className="mt-4 text-sm text-muted-foreground animate-in fade-in duration-700" style={{ animationDelay: '300ms' }}>
                No credit card required • Start in 2 minutes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
