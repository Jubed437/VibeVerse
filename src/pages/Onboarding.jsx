import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    occupation: "",
    workStress: "",
    workLifeBalance: "",
    primaryConcerns: [],
    currentSupport: [],
    previousTherapy: "",
    goals: [],
    communicationStyle: "",
    notifications: ""
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.name) {
      toast({ title: "Name required", description: "Please enter your name", variant: "destructive" });
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleComplete = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (user) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            name: formData.name,
            age_group: formData.age,
            gender: formData.gender,
            occupation: formData.occupation,
            work_stress_level: formData.workStress,
            work_life_balance: formData.workLifeBalance,
            primary_concerns: formData.primaryConcerns,
            current_support: formData.currentSupport,
            previous_therapy: formData.previousTherapy === "Yes",
            goals: formData.goals,
            communication_style: formData.communicationStyle,
            notification_preferences: formData.notifications,
            onboarding_completed: true
          })
          .eq('id', user.id);

        if (error) throw error;
      }
      
      toast({
        title: "Welcome to VibeVerse! 🎉",
        description: "Your personalized experience is ready"
      });
      
      window.location.href = "/dashboard";
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const OptionButton = ({ selected, onClick, children }) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all text-left ${
        selected
          ? "border-primary bg-primary/10 font-medium"
          : "border-border hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen gradient-calm flex items-center justify-center p-6">
      <Card className="glass-card w-full max-w-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Welcome to VibeVerse</h1>
            <p className="text-sm text-muted-foreground">Let's personalize your experience</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Basic Info</h2>
            
            <div className="space-y-2">
              <Label>What should we call you?</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Your name"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Age Group</Label>
              <div className="grid grid-cols-2 gap-3">
                {["18-24", "25-34", "35-44", "45+"].map(age => (
                  <OptionButton
                    key={age}
                    selected={formData.age === age}
                    onClick={() => updateField("age", age)}
                  >
                    {age}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gender (Optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                {["Male", "Female", "Non-binary", "Prefer not to say"].map(gender => (
                  <OptionButton
                    key={gender}
                    selected={formData.gender === gender}
                    onClick={() => updateField("gender", gender)}
                  >
                    {gender}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Professional Life</h2>
            
            <div className="space-y-2">
              <Label>Occupation</Label>
              <div className="grid grid-cols-2 gap-3">
                {["Student", "Working Professional", "Freelancer", "Unemployed", "Retired"].map(occ => (
                  <OptionButton
                    key={occ}
                    selected={formData.occupation === occ}
                    onClick={() => updateField("occupation", occ)}
                  >
                    {occ}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Work Stress Level</Label>
              <div className="grid grid-cols-3 gap-3">
                {["Low", "Medium", "High"].map(level => (
                  <OptionButton
                    key={level}
                    selected={formData.workStress === level}
                    onClick={() => updateField("workStress", level)}
                  >
                    {level}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Work-Life Balance</Label>
              <div className="grid grid-cols-2 gap-3">
                {["Poor", "Fair", "Good", "Excellent"].map(balance => (
                  <OptionButton
                    key={balance}
                    selected={formData.workLifeBalance === balance}
                    onClick={() => updateField("workLifeBalance", balance)}
                  >
                    {balance}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Mental Health Context</h2>
            
            <div className="space-y-2">
              <Label>Primary Concerns (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {["Anxiety", "Depression", "Stress", "Loneliness", "Sleep", "Relationships"].map(concern => (
                  <OptionButton
                    key={concern}
                    selected={formData.primaryConcerns.includes(concern)}
                    onClick={() => toggleMultiSelect("primaryConcerns", concern)}
                  >
                    <div className="flex items-center gap-2">
                      {formData.primaryConcerns.includes(concern) && <Check className="h-4 w-4" />}
                      {concern}
                    </div>
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Support (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {["Therapist", "Medication", "Support Group", "None"].map(support => (
                  <OptionButton
                    key={support}
                    selected={formData.currentSupport.includes(support)}
                    onClick={() => toggleMultiSelect("currentSupport", support)}
                  >
                    <div className="flex items-center gap-2">
                      {formData.currentSupport.includes(support) && <Check className="h-4 w-4" />}
                      {support}
                    </div>
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Previous Therapy Experience</Label>
              <div className="grid grid-cols-2 gap-3">
                {["Yes", "No"].map(exp => (
                  <OptionButton
                    key={exp}
                    selected={formData.previousTherapy === exp}
                    onClick={() => updateField("previousTherapy", exp)}
                  >
                    {exp}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Goals & Preferences</h2>
            
            <div className="space-y-2">
              <Label>What brings you here? (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {["Manage stress", "Track moods", "Talk to someone", "Journal", "All of the above"].map(goal => (
                  <OptionButton
                    key={goal}
                    selected={formData.goals.includes(goal)}
                    onClick={() => toggleMultiSelect("goals", goal)}
                  >
                    <div className="flex items-center gap-2">
                      {formData.goals.includes(goal) && <Check className="h-4 w-4" />}
                      {goal}
                    </div>
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preferred Communication Style</Label>
              <div className="grid grid-cols-3 gap-3">
                {["Casual", "Professional", "Empathetic"].map(style => (
                  <OptionButton
                    key={style}
                    selected={formData.communicationStyle === style}
                    onClick={() => updateField("communicationStyle", style)}
                  >
                    {style}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notification Preferences</Label>
              <div className="grid grid-cols-3 gap-3">
                {["Daily check-ins", "Weekly summaries", "None"].map(notif => (
                  <OptionButton
                    key={notif}
                    selected={formData.notifications === notif}
                    onClick={() => updateField("notifications", notif)}
                  >
                    {notif}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          
          {step < 4 ? (
            <Button
              onClick={handleNext}
              className="ml-auto gradient-primary text-white flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="ml-auto gradient-primary text-white flex items-center gap-2"
            >
              Complete
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Step {step} of 4 • You can update these preferences anytime in Settings
        </p>
      </Card>
    </div>
  );
};

export default Onboarding;
