import { useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface LogEntry {
    timestamp: string;
    level: 'info' | 'error' | 'success' | 'warning';
    message: string;
}

interface LogsCardProps {
    logs: LogEntry[];
}

export function LogsCard({ logs }: LogsCardProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    const getBadgeVariant = (level: string) => {
        switch (level) {
            case 'error': return 'destructive';
            case 'success': return 'default'; // or custom green
            case 'warning': return 'secondary'; // using secondary for warning distinctness usually yellow
            default: return 'outline';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Logs da Sessão</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-slate-950 text-slate-50 font-mono text-xs shadow-inner">
                    <div className="space-y-2">
                        {logs.length === 0 && (
                            <div className="text-slate-500 italic text-center py-8">Nenhum evento registrado ainda...</div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <span className="text-slate-400 shrink-0">
                                    [{new Date(log.timestamp).toLocaleTimeString()}]
                                </span>
                                <Badge variant={getBadgeVariant(log.level)} className="h-5 px-1 uppercase text-[10px] shrink-0">
                                    {log.level}
                                </Badge>
                                <span className="break-all">{log.message}</span>
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
