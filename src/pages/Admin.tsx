import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Activity, MessageSquare, ShieldCheck, Users } from "lucide-react";
import NavBar from "@/components/NavBar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TrendDays = 7 | 30 | 90;
interface Metrics {
  diagnoses: number; signups: number; queries: number;
  trends: { date: string; diagnoses: number }[];
  diseases: { name: string; count: number }[];
}

const LIST_LIMIT = 100;
const formatDate = (iso: string) => new Date(iso).toLocaleString();

function useAdminList<T>(key: string, load: () => PromiseLike<{ data: T[] | null; error: unknown }>) {
  return useQuery({ queryKey: ["admin", key], queryFn: async () => { const { data, error } = await load(); if (error) throw error; return data ?? []; } });
}

export default function Admin() {
  const [days, setDays] = useState<TrendDays>(30);

  const metrics = useQuery({
    queryKey: ["admin", "metrics", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_metrics", { days });
      if (error) throw error;
      return data as unknown as Metrics;
    },
  });

  const diagnoses = useAdminList("reports", () =>
    supabase.from("reports").select("id, predicted_disease, severity, confidence_score, diagnosis_date, cattle(name), profiles(full_name, phone, email)").order("diagnosis_date", { ascending: false }).limit(LIST_LIMIT));
  const farmers = useAdminList("profiles", () =>
    supabase.from("profiles").select("id, full_name, email, phone, location, created_at").order("created_at", { ascending: false }).limit(LIST_LIMIT));
  const queries = useAdminList("queries", () =>
    supabase.from("chatbot_queries").select("id, user_id, query, language, created_at").order("created_at", { ascending: false }).limit(LIST_LIMIT));

  const farmerName = (id: string) => farmers.data?.find((f) => f.id === id)?.full_name || "—";
  const stats = [
    { label: "Diagnoses", value: metrics.data?.diagnoses, icon: Activity },
    { label: "Farmers", value: metrics.data?.signups, icon: Users },
    { label: "Chatbot queries", value: metrics.data?.queries, icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Admin dashboard</h1>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center justify-between p-6">
                <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-bold">{value ?? "…"}</p></div>
                <Icon className="h-8 w-8 text-primary" />
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="flex gap-2">
          {([7, 30, 90] as TrendDays[]).map((d) => (
            <Button key={d} size="sm" variant={d === days ? "default" : "outline"} onClick={() => setDays(d)}>{d} days</Button>
          ))}
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Diagnosis trend</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ diagnoses: { label: "Diagnoses", color: "hsl(var(--primary))" } }} className="h-64 w-full">
                <LineChart data={metrics.data?.trends ?? []}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="diagnoses" stroke="var(--color-diagnoses)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Top diseases</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: "Cases", color: "hsl(var(--accent))" } }} className="h-64 w-full">
                <BarChart data={metrics.data?.diseases ?? []} layout="vertical">
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="diagnoses">
          <TabsList>
            <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
            <TabsTrigger value="farmers">Signups</TabsTrigger>
            <TabsTrigger value="queries">Chatbot queries</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnoses">
            <Card><CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Farmer</TableHead><TableHead>Contact</TableHead><TableHead>Cattle</TableHead><TableHead>Disease</TableHead><TableHead>Severity</TableHead></TableRow></TableHeader>
                <TableBody>
                  {diagnoses.data?.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(r.diagnosis_date)}</TableCell>
                      <TableCell>{r.profiles?.full_name || "—"}</TableCell>
                      <TableCell>{r.profiles?.phone || r.profiles?.email || "—"}</TableCell>
                      <TableCell>{r.cattle?.name ?? "—"}</TableCell>
                      <TableCell><Link className="text-primary underline-offset-4 hover:underline" to={`/report/${r.id}`}>{r.predicted_disease}</Link></TableCell>
                      <TableCell><Badge variant="secondary">{r.severity}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="farmers">
            <Card><CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Joined</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Location</TableHead></TableRow></TableHeader>
                <TableBody>
                  {farmers.data?.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(f.created_at)}</TableCell>
                      <TableCell>{f.full_name || "—"}</TableCell><TableCell>{f.email || "—"}</TableCell>
                      <TableCell>{f.phone || "—"}</TableCell><TableCell>{f.location || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="queries">
            <Card><CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Farmer</TableHead><TableHead>Language</TableHead><TableHead>Question</TableHead></TableRow></TableHeader>
                <TableBody>
                  {queries.data?.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(q.created_at)}</TableCell>
                      <TableCell>{farmerName(q.user_id)}</TableCell>
                      <TableCell className="uppercase">{q.language}</TableCell>
                      <TableCell className="max-w-md">{q.query}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
