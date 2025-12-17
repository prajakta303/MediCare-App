import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Lock, Globe, Eye, Plus, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const groupTypeIcons = {
  public: <Globe className="h-4 w-4" />,
  private: <Lock className="h-4 w-4" />,
  anonymous: <Eye className="h-4 w-4" />,
};

const groupTypeColors = {
  public: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  private: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  anonymous: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

interface CreateGroupForm {
  name: string;
  description: string;
  group_type: "public" | "private" | "anonymous";
}

export const SupportGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateGroupForm>();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["community-groups"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("community_groups")
        .select(`
          *,
          members:community_group_members(count)
        `)
        .eq("group_type", "public")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myMemberships } = useQuery({
    queryKey: ["my-group-memberships", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("community_group_members")
        .select("group_id")
        .eq("user_id", user!.id);
      
      if (error) throw error;
      return (data || []).map((m: any) => m.group_id);
    },
    enabled: !!user,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const { error } = await (supabase as any).from("community_groups").insert({
        name: data.name,
        description: data.description,
        group_type: data.group_type,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-groups"] });
      toast.success("Support group created successfully!");
      setCreateOpen(false);
      reset();
    },
    onError: () => {
      toast.error("Failed to create group");
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await (supabase as any).from("community_group_members").insert({
        group_id: groupId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-groups"] });
      queryClient.invalidateQueries({ queryKey: ["my-group-memberships"] });
      toast.success("Joined group successfully!");
    },
    onError: () => {
      toast.error("Failed to join group");
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Support Groups</h2>
          <p className="text-sm text-muted-foreground">
            Join groups to connect with others who share similar experiences
          </p>
        </div>
        
        {user && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Group</DialogTitle>
                <DialogDescription>
                  Create a new support group for people to connect and share experiences.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit((data) => createGroupMutation.mutate(data))} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input id="name" {...register("name", { required: true })} placeholder="e.g., Diabetes Support Circle" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register("description")} placeholder="What is this group about?" />
                </div>
                <div className="space-y-2">
                  <Label>Group Type</Label>
                  <Select onValueChange={(value) => setValue("group_type", value as any)} defaultValue="public">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Public - Anyone can join
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" /> Private - Invite only
                        </div>
                      </SelectItem>
                      <SelectItem value="anonymous">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" /> Anonymous - Hidden identities
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createGroupMutation.isPending}>
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups?.map((group) => {
          const isMember = myMemberships?.includes(group.id);
          const memberCount = (group.members as any)?.[0]?.count || 0;

          return (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge className={groupTypeColors[group.group_type as keyof typeof groupTypeColors]}>
                    <span className="flex items-center gap-1">
                      {groupTypeIcons[group.group_type as keyof typeof groupTypeIcons]}
                      {group.group_type}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {memberCount}
                  </Badge>
                </div>
                <CardTitle className="mt-3">{group.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {group.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user && (
                  <Button
                    variant={isMember ? "secondary" : "default"}
                    className="w-full gap-2"
                    disabled={isMember || joinGroupMutation.isPending}
                    onClick={() => !isMember && joinGroupMutation.mutate(group.id)}
                  >
                    {isMember ? (
                      <>
                        <Check className="h-4 w-4" /> Joined
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" /> Join Group
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {groups?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No support groups yet. Be the first to create one!</p>
          </div>
        )}
      </div>
    </div>
  );
};
