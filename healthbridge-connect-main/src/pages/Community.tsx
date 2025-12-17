import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForumCategories } from "@/components/community/ForumCategories";
import { SupportGroups } from "@/components/community/SupportGroups";
import { TrendingPosts } from "@/components/community/TrendingPosts";
import { UserTrustBadge } from "@/components/community/UserTrustBadge";
import { CreatePostDialog } from "@/components/community/CreatePostDialog";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Users, TrendingUp, Bell } from "lucide-react";
import { Helmet } from "react-helmet";

const Community = () => {
  const { user, profile } = useAuth();
  const [createPostOpen, setCreatePostOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Community Forum | HealthConnect</title>
        <meta name="description" content="Join our health community to discuss topics, share experiences, and connect with others on their health journey." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Community Forum</h1>
              <p className="text-muted-foreground mt-1">
                Connect, share, and learn from others on their health journey
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <UserTrustBadge userId={user.id} />
                  <Button onClick={() => setCreatePostOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Post
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Disclaimer:</strong> Community discussions are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider.
            </p>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="forums" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="forums" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Forums
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2">
                <Users className="h-4 w-4" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="forums" className="space-y-6">
              <ForumCategories />
            </TabsContent>

            <TabsContent value="groups" className="space-y-6">
              <SupportGroups />
            </TabsContent>

            <TabsContent value="trending" className="space-y-6">
              <TrendingPosts />
            </TabsContent>
          </Tabs>
        </div>

        <CreatePostDialog open={createPostOpen} onOpenChange={setCreatePostOpen} />
      </div>
    </>
  );
};

export default Community;
