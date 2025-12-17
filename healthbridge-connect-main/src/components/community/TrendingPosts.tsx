import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const TrendingPosts = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["trending-posts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("community_posts")
        .select(`
          *,
          forum:community_forums(name),
          author:profiles(first_name, last_name, avatar_url),
          comments:community_comments(count),
          reactions:community_reactions(count)
        `)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Sort by engagement (comments + reactions)
      return data.sort((a, b) => {
        const aEngagement = ((a.comments as any)?.[0]?.count || 0) + ((a.reactions as any)?.[0]?.count || 0);
        const bEngagement = ((b.comments as any)?.[0]?.count || 0) + ((b.reactions as any)?.[0]?.count || 0);
        return bEngagement - aEngagement;
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Trending Discussions</h2>
          <p className="text-sm text-muted-foreground">Most engaging posts from the community</p>
        </div>
      </div>

      <div className="space-y-4">
        {posts?.map((post, index) => (
          <div key={post.id} className="relative">
            {index < 3 && (
              <Badge 
                className="absolute -top-2 -left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                #{index + 1}
              </Badge>
            )}
            <PostCard post={post} />
          </div>
        ))}

        {posts?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trending posts yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};
