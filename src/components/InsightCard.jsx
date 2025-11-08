import { Sparkles } from "lucide-react";

const InsightCard = ({ title, description, icon, gradient = "gradient-primary" }) => {
  return (
    <div className="glass-card rounded-2xl p-6 shadow-card transition-smooth hover:scale-[1.02] hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className={`${gradient} p-3 rounded-xl glow-primary`}>
          {icon || <Sparkles className="h-6 w-6 text-white" />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
