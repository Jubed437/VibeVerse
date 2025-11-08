import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Volume2, Download, Trash2, Sparkles, Settings, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { supabase } from "@/lib/supabase";

const Chat = () => {
  const { toast } = useToast();
  const { profile, getPersonalizedGreeting } = useUserProfile();
  
  const getInitialMessage = () => {
    if (!profile) return "Hey there! I'm Vibe, your AI companion. How are you feeling today? I'm here to listen and support you.";
    
    const { name, communicationStyle } = profile;
    
    if (communicationStyle === "Casual") {
      return `Hey ${name}! What's up? I'm Vibe, your AI buddy. How's your day going? I'm here whenever you need to chat.`;
    } else if (communicationStyle === "Professional") {
      return `Hello ${name}. I'm Vibe, your AI therapeutic companion. How are you feeling today? I'm here to provide support and guidance.`;
    } else if (communicationStyle === "Empathetic") {
      return `Hi ${name}. I'm Vibe, and I'm here for you. How are you feeling today? Whatever you're going through, I'm here to listen and support you.`;
    }
    
    return `Hey ${name}! I'm Vibe, your AI companion. How are you feeling today? I'm here to listen and support you.`;
  };
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [detectedTone, setDetectedTone] = useState("Reflective 🧘");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWaitingForWakeWord, setIsWaitingForWakeWord] = useState(true);
  const [recognition, setRecognition] = useState(null);
  const [synthesis] = useState(window.speechSynthesis);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voiceConfidence, setVoiceConfidence] = useState(0);
  const [toneHistory, setToneHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    loadToneHistory();
    
    // Load voices with delay to ensure they're available
    if (synthesis.getVoices().length === 0) {
      synthesis.addEventListener('voiceschanged', loadVoices);
    } else {
      loadVoices();
    }
  }, [profile]);

  const loadVoices = () => {
    const voices = synthesis.getVoices();
    
    // Try to find Sofia first
    let voice = voices.find(v => v.name.toLowerCase().includes('sofia'));
    
    // If Sofia not found, try other pleasant female voices
    if (!voice) {
      voice = voices.find(v => 
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('karen') ||
        v.name.toLowerCase().includes('victoria') ||
        v.name.toLowerCase().includes('zira')
      );
    }
    
    // If still not found, get any female voice
    if (!voice) {
      voice = voices.find(v => v.name.toLowerCase().includes('female'));
    }
    
    // Last resort: get first voice
    if (!voice && voices.length > 0) {
      voice = voices[0];
    }
    
    if (voice && !selectedVoice) {
      setSelectedVoice(voice);
      console.log('Selected voice:', voice.name);
    }
  };

  const loadToneHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('chat_tone_analysis')
        .select('detected_tone, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setToneHistory(data);
    } catch (error) {
      console.error('Error loading tone history:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isSpeaking, interimTranscript]);

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice input not supported in your browser",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      toast({ title: "Listening", description: "Speak now..." });
    };

    recognitionInstance.onresult = (event) => {
      let interim = '';
      let final = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      
      setInterimTranscript(interim);
      
      if (final) {
        setInterimTranscript('');
        handleVoiceInput(final);
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({
          title: "Microphone Error",
          description: event.error === 'not-allowed' ? 'Please allow microphone access' : 'Could not access microphone',
          variant: "destructive"
        });
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);
    recognitionInstance.start();
  };

  const speakText = (text, force = false) => {
    if (!synthesis || (!autoSpeak && !force)) return;
    
    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.volume = 0.9;
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (continuousMode) {
        setTimeout(() => startVoiceRecognition(), 500);
      }
    };
    
    synthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthesis) {
      synthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleVoiceInput = async (transcript) => {
    const cleanText = transcript.trim();
    if (!cleanText) return;

    const userMessage = {
      role: "user",
      content: cleanText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(userMessage);
    setIsLoading(true);
    
    const tone = await detectToneWithAI(cleanText);
    setDetectedTone(tone);
    await saveToneAnalysis(cleanText, tone);
    setToneHistory(prev => [{ detected_tone: tone, created_at: new Date() }, ...prev.slice(0, 9)]);

    try {
      const aiResponse = await getAIResponse(cleanText);
      
      const aiMessage = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      await saveMessage(aiMessage);
      
      speakText(aiResponse);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(data.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at)
        })));
      } else {
        const initialMsg = {
          role: "assistant",
          content: getInitialMessage(),
          timestamp: new Date()
        };
        setMessages([initialMsg]);
        await saveMessage(initialMsg);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      setMessages([{
        role: "assistant",
        content: getInitialMessage(),
        timestamp: new Date()
      }]);
    }
  };

  const saveMessage = async (message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user - testing mode, message not saved');
        return;
      }

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: message.role,
        content: message.content
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const detectToneWithAI = async (text) => {
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
          messages: [
            {
              role: 'system',
              content: 'Analyze the emotional tone. Respond with ONLY ONE WORD: Happy, Sad, Anxious, Angry, Calm, Excited, Tired, Lonely, Stressed, Hopeful, Frustrated, Peaceful, Overwhelmed, Content, or Worried.'
            },
            { role: 'user', content: text }
          ],
          temperature: 0.3,
          max_tokens: 10
        })
      });

      if (!response.ok) throw new Error('AI failed');
      
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Tone detection error:', error);
      const input = text.toLowerCase();
      if (input.includes('happy') || input.includes('great') || input.includes('good')) return "Happy";
      if (input.includes('sad') || input.includes('down') || input.includes('depressed')) return "Sad";
      if (input.includes('anxious') || input.includes('worried') || input.includes('panic')) return "Anxious";
      if (input.includes('angry') || input.includes('frustrated')) return "Angry";
      if (input.includes('stressed') || input.includes('overwhelmed')) return "Stressed";
      return "Reflective";
    }
  };

  const saveToneAnalysis = async (messageContent, tone) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('chat_tone_analysis').insert({
        user_id: user.id,
        message_content: messageContent,
        detected_tone: tone
      });
    } catch (error) {
      console.error('Error saving tone:', error);
    }
  };

  const getAIResponse = async (userInput) => {
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('API key missing');

      const conversationHistory = messages.slice(-5).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

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
              content: `You are Vibe, an empathetic AI companion for emotional wellness. Respond in 1-2 short, conversational sentences like a natural spoken conversation. Be warm, supportive, and direct. ${profile?.communicationStyle ? `User prefers ${profile.communicationStyle} communication style.` : ''}`
            },
            ...conversationHistory,
            { role: 'user', content: userInput }
          ],
          temperature: 0.7,
          max_tokens: 80
        })
      });

      if (!response.ok) {
        throw new Error('Groq API failed');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Groq error:', error);
      return getFallbackResponse(userInput);
    }
  };

  const getFallbackResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('anxious') || input.includes('anxiety') || input.includes('worried') || input.includes('panic')) {
      const responses = [
        `I hear you're feeling anxious right now. Anxiety can feel overwhelming, but there are some grounding techniques that can help bring you back to the present moment and calm your nervous system.

Key Points:
• Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste
• Practice box breathing: breathe in for 4 counts, hold for 4, breathe out for 4, hold for 4
• Remember that anxiety is your body trying to protect you, even though it feels uncomfortable

Your feelings are completely valid. Anxiety often comes from worrying about things outside our control. What's the main thing that's worrying you right now? Sometimes just talking about it can help take away some of its power.`,
        `It sounds like you're experiencing anxiety. This is a really common feeling, and while it's uncomfortable, there are practical steps we can take together to help you feel more grounded and in control.

Key Points:
• Focus on what you can control right now, even if it's just your breathing
• Anxiety often peaks and then naturally decreases - ride the wave rather than fighting it
• Physical movement like a short walk can help release anxious energy

Your body is responding to perceived stress, but you're safe right now. What specific situation or thought is triggering these anxious feelings? Understanding the source can help us address it more effectively.`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (input.includes('sad') || input.includes('depressed') || input.includes('down') || input.includes('hopeless')) {
      const responses = [
        `I'm really sorry you're feeling this way. Depression can make everything feel heavy and impossible, but I want you to know that your feelings are valid and you don't have to face this alone.

Key Points:
• Even small steps count - getting through today is an achievement
• Depression often lies to us, making us believe things won't get better (but they can and do)
• Reaching out, like you're doing now, is actually a sign of strength

These feelings won't last forever, even though I know it doesn't feel that way right now. What's been going on that's contributing to how you're feeling? Sometimes just sharing the weight can help lighten the load a bit.`,
        `I hear you, and I want you to acknowledge that what you're feeling is real and difficult. Depression makes everything feel impossible, but you're here talking to me, and that matters more than you might realize.

Key Points:
• You matter, even when it doesn't feel like it
• Small comforts can help - what usually brings you even a tiny bit of relief?
• Consider reaching out to a trusted friend, family member, or professional for additional support

You're doing the best you can with what you have right now, and that's enough. Have you been able to talk to anyone else about how you're feeling? You don't have to carry this alone.`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (input.includes('angry') || input.includes('frustrated') || input.includes('mad') || input.includes('annoyed')) {
      const responses = [
        `I can tell you're really frustrated right now, and that's completely valid. Anger usually means something important to you isn't being respected or a boundary has been crossed.

Key Points:
• Your anger is giving you information - something needs to change
• It's okay to feel angry; it's what you do with it that matters
• Sometimes venting helps, other times taking a break to cool down is better

What happened that triggered these feelings? Let's talk through it and figure out what you need to feel better about this situation. What would actually help resolve this?`,
        `That sounds really frustrating. Anger is a natural emotion that tells us when something isn't right. Let's work through this together and figure out what you need.

Key Points:
• Identify what specifically triggered your anger - what boundary was crossed?
• Consider what's in your control vs. what isn't
• Physical release can help - take a walk, do some exercise, or try deep breathing

Your feelings are valid, and something clearly needs to change here. Do you want to vent about what happened, or would you prefer to focus on what you can do about it?`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (input.includes('stressed') || input.includes('overwhelmed') || input.includes('too much')) {
      const responses = [
        `Feeling overwhelmed is exhausting. When everything feels urgent and too much, it's hard to know where to even start. Let's break this down into manageable pieces together.

Key Points:
• Focus on ONE thing at a time - what feels most urgent right now?
• Not everything needs to be done today - what can wait?
• Small wins build momentum - even tiny tasks completed help

Take a breath and grab some water if you can. What's the main thing that's overwhelming you right now? Once we identify that, we can figure out what actually needs your attention versus what can be delegated, delayed, or dropped.`,
        `That's a lot to handle. When stress piles up, our brains can go into overload mode. The key is to step back and prioritize rather than trying to tackle everything at once.

Key Points:
• List out what's stressing you - seeing it written helps
• Categorize: what's urgent, what's important, what can wait
• Ask for help where you can - you don't have to do everything alone

Stress is your mind telling you there's too much on your plate. What would make today feel more manageable? Let's figure out what you can let go of or get support with.`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (input.includes('lonely') || input.includes('alone') || input.includes('isolated')) {
      const responses = [
        `I'm sorry you're feeling lonely. That's such a hard feeling to sit with. Connection is a fundamental human need, and it's completely understandable that you're missing it.

Key Points:
• You're talking to me right now, which is a start - reaching out matters
• Even small connections can help - a text to a friend, a call to family
• Consider joining groups or communities around your interests (online or in-person)

What kind of connection are you missing most right now? Is it deep conversation, casual companionship, or just having someone around? Understanding what you need can help us think of ways to address it.`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (input.includes('happy') || input.includes('good') || input.includes('great') || input.includes('better')) {
      const responses = [
        `That's wonderful! I'm so glad you're feeling good. It's really important to celebrate these positive moments and understand what's contributing to them.

Key Points:
• Acknowledge what's going well - this helps reinforce positive patterns
• Notice what helped you get to this good place
• These positive feelings are valuable data for when things get tough again

What's going well for you right now? Tell me about it! Understanding what works for you is super valuable.`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    const defaultResponses = [
      `Thanks for sharing that with me. I'm here to listen without judgment, and I want you to know that whatever you're feeling is valid.

Key Points:
• Your feelings matter and deserve to be heard
• There's no right or wrong way to feel
• Taking time to process and talk helps

What's on your mind right now? Would it help to talk more about what you're experiencing, or would you prefer some practical suggestions?`,
      `I hear you. Whatever you're going through, your feelings are completely valid and it's good that you're talking about it.

Key Points:
• You don't have to figure everything out at once
• It's okay to not be okay sometimes
• Reaching out is a positive step

What feels most important or pressing to you right now? Let's focus on that together.`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(userMessage);
    
    const userInput = input;
    setInput("");
    setIsLoading(true);
    
    const tone = await detectToneWithAI(userInput);
    setDetectedTone(tone);
    await saveToneAnalysis(userInput, tone);
    setToneHistory(prev => [{ detected_tone: tone, created_at: new Date() }, ...prev.slice(0, 9)]);

    try {
      const aiResponse = await getAIResponse(userInput);
      
      const aiMessage = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      await saveMessage(aiMessage);
      
      if (autoSpeak) {
        speakText(aiResponse);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response. Please check your API key.",
        variant: "destructive"
      });
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('chat_messages').delete().eq('user_id', user.id);
      
      const initialMsg = {
        role: "assistant",
        content: "Chat cleared. How can I help you today?",
        timestamp: new Date(),
      };
      
      setMessages([initialMsg]);
      await saveMessage(initialMsg);
      setDetectedTone("Reflective 🧘");
      toast({ title: "Chat Cleared", description: "Your conversation has been reset." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to clear chat", variant: "destructive" });
    }
  };

  return (
    <div className="h-screen flex flex-col gradient-calm">
      <div className="glass-card border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Chat with Vibe
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {isListening ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-pulse text-primary">●</span> Listening... {voiceConfidence > 0 && `(${voiceConfidence}%)`}
                  </span>
                ) : (
                  <>Tone: <span className="text-primary font-medium">{detectedTone}</span></>
                )}
              </p>
              {toneHistory.length > 0 && (
                <div className="flex items-center gap-1">
                  {toneHistory.slice(0, 5).map((t, i) => (
                    <div key={i} className="w-1 bg-primary rounded-full" style={{ height: `${8 + i * 2}px`, opacity: 1 - i * 0.15 }}></div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={async () => {
              const chatText = messages.map(m => `[${m.role.toUpperCase()}] ${m.timestamp.toLocaleString()}\n${m.content}\n`).join('\n');
              const blob = new Blob([chatText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vibe-chat-${new Date().toISOString().split('T')[0]}.txt`;
              a.click();
              toast({ title: "Chat Exported", description: "Your conversation has been downloaded" });
            }} title="Export chat history">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>



      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-soft group relative transform transition-all duration-300 hover:scale-[1.02] ${
                  message.role === "user"
                    ? "gradient-primary text-white"
                    : "glass-card"
                }`}
                title={message.timestamp.toLocaleString()}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                <p className={`text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                  {message.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {interimTranscript && isListening && (
            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="glass-card max-w-[80%] rounded-2xl px-6 py-4 shadow-soft border-2 border-primary/50">
                <p className="text-sm text-muted-foreground italic">{interimTranscript}</p>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="glass-card max-w-[80%] rounded-2xl px-6 py-4 shadow-soft">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <p className="text-sm text-muted-foreground">Vibe is thinking...</p>
                </div>
              </div>
            </div>
          )}
          {isSpeaking && (
            <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="glass-card max-w-[80%] rounded-2xl px-6 py-4 shadow-soft border-2 border-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-end gap-1">
                    <span className="w-1 bg-secondary rounded-full animate-pulse" style={{ height: '8px', animationDuration: '0.5s' }}></span>
                    <span className="w-1 bg-secondary rounded-full animate-pulse" style={{ height: '16px', animationDuration: '0.7s' }}></span>
                    <span className="w-1 bg-secondary rounded-full animate-pulse" style={{ height: '12px', animationDuration: '0.6s' }}></span>
                    <span className="w-1 bg-secondary rounded-full animate-pulse" style={{ height: '20px', animationDuration: '0.8s' }}></span>
                    <span className="w-1 bg-secondary rounded-full animate-pulse" style={{ height: '10px', animationDuration: '0.5s' }}></span>
                  </div>
                  <p className="text-sm text-muted-foreground">Vibe is speaking...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="glass-card border-t border-border px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoSpeak} 
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-xs text-muted-foreground">Auto-speak</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={continuousMode} 
                onChange={(e) => setContinuousMode(e.target.checked)}
                className="w-4 h-4 accent-secondary"
              />
              <span className="text-xs text-muted-foreground">Continuous</span>
            </label>
            <div className="text-xs px-2 py-1 rounded-lg glass-card border-border">
              Sofia
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (isListening) {
                    recognition?.stop();
                    setIsListening(false);
                    toast({ title: "Stopped", description: "Microphone turned off" });
                  } else {
                    startVoiceRecognition();
                  }
                }}
                disabled={isLoading || isSpeaking}
                className={`rounded-full w-12 h-12 transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/50' 
                    : 'border-primary text-primary hover:bg-primary hover:text-white'
                }`}
              >
                <Mic className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
              </Button>
              {isListening && (
                <>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                  <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
                    🎤 Listening...
                  </span>
                </>
              )}
            </div>
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Share your thoughts..."
              className="flex-1 rounded-full px-6 h-12 glass-card border-border"
              disabled={isLoading}
            />
            
            <Button
              onClick={handleSend}
              disabled={isLoading}
              className="rounded-full w-12 h-12 gradient-primary text-white glow-primary hover:opacity-90 transition-smooth disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={isSpeaking ? stopSpeaking : () => speakText(messages[messages.length - 1]?.content || '', true)}
              className={`rounded-full w-12 h-12 border-secondary text-secondary hover:bg-secondary hover:text-white transition-smooth ${
                isSpeaking ? 'bg-secondary text-white animate-pulse' : ''
              }`}
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
