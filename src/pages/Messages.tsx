import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: string;
  farmer_id: string;
  vet_id: string;
  report_id: string | null;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  other_user?: {
    full_name: string;
    email: string;
  };
  report?: {
    predicted_disease: string;
    cattle?: {
      name: string;
    };
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export default function Messages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  // Fetch conversations
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: convos, error } = await supabase
        .from("conversations")
        .select(`
          *,
          profiles!conversations_farmer_id_fkey(full_name, email),
          profiles!conversations_vet_id_fkey(full_name, email),
          reports(predicted_disease, cattle(name))
        `)
        .or(`farmer_id.eq.${user.id},vet_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Transform data to include other user's info
      return convos?.map((convo) => {
        const isVet = convo.vet_id === user.id;
        return {
          ...convo,
          other_user: isVet 
            ? (convo as any).profiles_conversations_farmer_id_fkey
            : (convo as any).profiles_conversations_vet_id_fkey,
          report: (convo as any).reports,
        };
      }) as Conversation[];
    },
    enabled: !!currentUser,
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedConversation) throw new Error("Invalid state");

      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", selectedConversation] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(messageText);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Messages</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="p-4 md:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Conversations</h2>
            <ScrollArea className="h-[calc(100%-40px)]">
              {loadingConversations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : conversations?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations?.map((convo) => (
                    <Card
                      key={convo.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation === convo.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedConversation(convo.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {convo.other_user?.full_name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {convo.other_user?.full_name || convo.other_user?.email}
                          </p>
                          {convo.report && (
                            <p className="text-xs text-muted-foreground truncate">
                              Re: {convo.report.predicted_disease}
                              {convo.report.cattle?.name && ` - ${convo.report.cattle.name}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Messages Area */}
          <Card className="p-4 md:col-span-2 flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 mb-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4 pr-4">
                      {messages?.map((message) => {
                        const isOwn = message.sender_id === currentUser?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
