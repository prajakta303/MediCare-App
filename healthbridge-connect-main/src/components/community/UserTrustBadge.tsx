import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, Award, Shield, Zap, Crown } from "lucide-react";

interface UserTrustBadgeProps {
  userId: string;
  showScore?: boolean;
}

const getTrustLevel = (score: number) => {
  if (score >= 1000) return { level: "Champion", icon: Crown, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900" };
  if (score >= 500) return { level: "Expert", icon: Shield, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900" };
  if (score >= 200) return { level: "Contributor", icon: Award, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900" };
  if (score >= 50) return { level: "Member", icon: Zap, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900" };
  return { level: "Newcomer", icon: Star, color: "text-muted-foreground", bg: "bg-muted" };
};

export const UserTrustBadge = ({ userId, showScore = true }: UserTrustBadgeProps) => {
  const { data: trustScore } = useQuery({
    queryKey: ["trust-score", userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("community_trust_scores")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: badges } = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("community_user_badges")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data as { id: string; badge_type: string }[];
    },
  });

  const score = trustScore?.score || 0;
  const trustLevel = getTrustLevel(score);
  const Icon = trustLevel.icon;

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1 ${trustLevel.bg} border-0`}>
            <Icon className={`h-3 w-3 ${trustLevel.color}`} />
            <span className={trustLevel.color}>{trustLevel.level}</span>
            {showScore && (
              <span className="text-muted-foreground ml-1">({score})</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Trust Score: {score}</p>
            <p className="text-xs text-muted-foreground">
              Earned from helpful contributions and positive interactions
            </p>
          </div>
        </TooltipContent>
      </Tooltip>

      {badges?.map((badge) => (
        <Tooltip key={badge.id}>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1">
              {badge.badge_type === "verified_doctor" && <Shield className="h-3 w-3" />}
              {badge.badge_type === "expert" && <Award className="h-3 w-3" />}
              {badge.badge_type === "helpful" && <Star className="h-3 w-3" />}
              {badge.badge_type === "moderator" && <Zap className="h-3 w-3" />}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">{badge.badge_type.replace("_", " ")}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
