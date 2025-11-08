import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (user) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) console.error('Profile fetch error:', error);
          if (data) {
            setProfile({
              name: data.name,
              age: data.age_group,
              gender: data.gender,
              occupation: data.occupation,
              workStress: data.work_stress_level,
              workLifeBalance: data.work_life_balance,
              primaryConcerns: data.primary_concerns || [],
              currentSupport: data.current_support || [],
              previousTherapy: data.previous_therapy ? "Yes" : "No",
              goals: data.goals || [],
              communicationStyle: data.communication_style,
              notifications: data.notification_preferences,
              avatar: data.avatar_url
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateProfile = async (newData) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (user) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            name: newData.name,
            avatar_url: newData.avatar,
            communication_style: newData.communicationStyle
          })
          .eq('id', user.id);

        if (error) throw error;
        setProfile({ ...profile, ...newData });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getPersonalizedGreeting = () => {
    if (!profile) return "Hey there!";
    
    const { name, communicationStyle } = profile;
    
    if (communicationStyle === "Casual") {
      return `Hey ${name}! What's up?`;
    } else if (communicationStyle === "Professional") {
      return `Hello ${name}, how are you today?`;
    } else if (communicationStyle === "Empathetic") {
      return `Hi ${name}, how are you feeling today?`;
    }
    
    return `Hey ${name}!`;
  };

  const getPersonalizedContent = () => {
    if (!profile) return null;

    const { occupation, primaryConcerns, workStress } = profile;
    
    return {
      isStudent: occupation === "Student",
      isWorking: occupation === "Working Professional",
      hasHighStress: workStress === "High",
      hasAnxiety: primaryConcerns?.includes("Anxiety"),
      hasDepression: primaryConcerns?.includes("Depression"),
      concerns: primaryConcerns || []
    };
  };

  return {
    profile,
    loading,
    updateProfile,
    getPersonalizedGreeting,
    getPersonalizedContent
  };
};
