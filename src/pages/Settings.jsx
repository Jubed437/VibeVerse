import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Palette, Download, Trash2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/use-user-profile";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile, updateProfile } = useUserProfile();
  const [aiSpeech, setAiSpeech] = useState(true);
  const [microphone, setMicrophone] = useState(true);
  const [user, setUser] = useState(null);
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    status: "Finding peace in every moment ✨",
    avatar: ""
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
        if (user) {
          setProfileData({
            name: profile?.name || user.user_metadata?.name || "User",
            email: user.email || "",
            status: "Finding peace in every moment ✨",
            avatar: profile?.avatar || ""
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, [profile]);
  
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  const presetAvatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack"
  ];
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({...profileData, avatar: reader.result});
        setShowAvatarPicker(false);
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been changed"
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const selectPresetAvatar = (avatarUrl) => {
    setProfileData({...profileData, avatar: avatarUrl});
    setShowAvatarPicker(false);
    toast({
      title: "Avatar Updated",
      description: "Your profile picture has been changed"
    });
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      toast({ title: "Error", description: "Failed to logout", variant: "destructive" });
    }
  };

  const handleDataReset = () => {
    toast({
      title: "Data Reset",
      description: "Your mood data has been cleared.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen gradient-calm">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your preferences and account</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Bell className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Download className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="glass-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="gradient-primary text-white text-2xl">
                      {profileData.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>Change Avatar</Button>
                </div>
                
                {showAvatarPicker && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Upload Custom Photo</Label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <label 
                          htmlFor="avatar-upload"
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-primary/50 rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                        >
                          <User className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium text-primary">Choose Photo from Device</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Or Choose a Preset Avatar</Label>
                      <div className="grid grid-cols-4 gap-3">
                        {presetAvatars.map((avatarUrl, index) => (
                          <button
                            key={index}
                            onClick={() => selectPresetAvatar(avatarUrl)}
                            className="relative group"
                          >
                            <Avatar className="h-16 w-16 border-2 border-transparent hover:border-primary transition-all cursor-pointer">
                              <AvatarImage src={avatarUrl} />
                            </Avatar>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status Message</Label>
                    <Input 
                      id="status" 
                      value={profileData.status}
                      onChange={(e) => setProfileData({...profileData, status: e.target.value})}
                    />
                  </div>
                  
                  {profile?.age && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">Age Group</Label>
                        <p className="text-sm font-medium">{profile?.age || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Occupation</Label>
                        <p className="text-sm font-medium">{profile?.occupation || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Communication Style</Label>
                        <p className="text-sm font-medium">{profile?.communicationStyle || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Work Stress</Label>
                        <p className="text-sm font-medium">{profile?.workStress || "Not set"}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={async () => {
                    await updateProfile({
                      name: profileData.name,
                      avatar: profileData.avatar
                    });
                    toast({
                      title: "Profile Updated",
                      description: "Your changes have been saved"
                    });
                    window.location.reload();
                  }}
                  className="gradient-primary text-white glow-primary hover:opacity-90 transition-smooth"
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="glass-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription>Control AI speech and microphone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-speech">AI Speech</Label>
                    <p className="text-sm text-muted-foreground">Enable voice responses from Vibe</p>
                  </div>
                  <Switch id="ai-speech" checked={aiSpeech} onCheckedChange={setAiSpeech} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="microphone">Microphone Access</Label>
                    <p className="text-sm text-muted-foreground">Allow voice input in chat</p>
                  </div>
                  <Switch id="microphone" checked={microphone} onCheckedChange={setMicrophone} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Daily reminders and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Reflection</Label>
                    <p className="text-sm text-muted-foreground">Remind me to journal</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mood Check-ins</Label>
                    <p className="text-sm text-muted-foreground">Periodic mood updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="glass-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Theme Customization</CardTitle>
                <CardDescription>Choose your accent color</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: "Lilac", color: "hsl(270, 70%, 65%)" },
                    { name: "Blue", color: "hsl(220, 80%, 60%)" },
                    { name: "Mint", color: "hsl(160, 60%, 60%)" },
                  ].map((theme) => (
                    <button
                      key={theme.name}
                      className="p-6 rounded-xl glass-card hover:scale-105 transition-smooth"
                    >
                      <div
                        className="w-full h-20 rounded-lg mb-3"
                        style={{ backgroundColor: theme.color }}
                      />
                      <p className="font-medium">{theme.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card className="glass-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export or reset your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start gap-3" onClick={async () => {
                  try {
                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    if (userError) throw userError;
                    if (!user) return;
                    const { data, error } = await supabase.from('journal_entries').select('*').eq('user_id', user.id);
                    if (error) throw error;
                    const text = data.map(e => `${new Date(e.created_at).toLocaleString()}\n${e.content}\n\n`).join('---\n\n');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `journal-${new Date().toISOString().split('T')[0]}.txt`;
                    a.click();
                    toast({ title: "Journal Exported", description: "Your journal has been downloaded" });
                  } catch (error) {
                    console.error('Export error:', error);
                    toast({ title: "Error", description: "Failed to export journal", variant: "destructive" });
                  }
                }}>
                  <Download className="h-4 w-4" />
                  Export Journal as Text File
                </Button>

                <Button variant="outline" className="w-full justify-start gap-3" onClick={async () => {
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const { data } = await supabase.from('mood_entries').select('*').eq('user_id', user.id);
                    const csv = 'Date,Mood\n' + data.map(e => `${e.created_at},${e.mood}`).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mood-data-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    toast({ title: "Mood Data Exported", description: "Your mood data has been downloaded" });
                  } catch (error) {
                    toast({ title: "Error", description: "Failed to export mood data", variant: "destructive" });
                  }
                }}>
                  <Download className="h-4 w-4" />
                  Export Mood Data (CSV)
                </Button>

                <Button
                  variant="destructive"
                  className="w-full justify-start gap-3"
                  onClick={async () => {
                    if (!confirm('Are you sure? This will delete all your mood entries permanently.')) return;
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      await supabase.from('mood_entries').delete().eq('user_id', user.id);
                      toast({ title: "Data Reset", description: "Your mood data has been cleared", variant: "destructive" });
                    } catch (error) {
                      toast({ title: "Error", description: "Failed to reset data", variant: "destructive" });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Reset All Mood Data
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card border-border shadow-card border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-3"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
