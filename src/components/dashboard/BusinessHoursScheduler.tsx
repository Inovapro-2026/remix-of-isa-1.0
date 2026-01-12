import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

interface ScheduleDay {
    day: string;
    isOpen: boolean;
    start: string;
    end: string;
}

interface BusinessHoursSchedulerProps {
    initialConfig?: ScheduleDay[];
    onChange: (text: string, config: ScheduleDay[]) => void;
}

const DAYS = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo"
];

export const BusinessHoursScheduler = ({ initialConfig, onChange }: BusinessHoursSchedulerProps) => {
    const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
        if (initialConfig && initialConfig.length === 7) return initialConfig;
        return DAYS.map(day => ({
            day,
            isOpen: true,
            start: "09:00",
            end: "18:00"
        }));
    });

    useEffect(() => {
        // Generate text representation
        const lines = schedule
            .filter(d => d.isOpen)
            .map(d => `${d.day}: ${d.start} às ${d.end}`);

        if (lines.length === 0) {
            onChange("Fechado temporariamente", schedule);
        } else {
            // Group similar days if possible (Simple grouping)
            // For now, just listing them is fine for AI reading, or we can just send the full text
            onChange(lines.join("\n"), schedule);
        }
    }, [schedule]);

    const updateDay = (index: number, updates: Partial<ScheduleDay>) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], ...updates };
        setSchedule(newSchedule);
    };

    return (
        <div className="space-y-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-200">Configurar Horários</span>
            </div>

            <div className="space-y-3">
                {schedule.map((day, index) => (
                    <div key={day.day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded bg-zinc-950/30 border border-zinc-900">
                        <div className="flex items-center gap-3 w-40">
                            <Switch
                                checked={day.isOpen}
                                onCheckedChange={(checked) => updateDay(index, { isOpen: checked })}
                            />
                            <span className={`text-sm ${day.isOpen ? 'text-zinc-200' : 'text-zinc-500'}`}>
                                {day.day}
                            </span>
                        </div>

                        {day.isOpen ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="time"
                                    value={day.start}
                                    onChange={(e) => updateDay(index, { start: e.target.value })}
                                    className="w-24 h-8 bg-zinc-900 border-zinc-800"
                                />
                                <span className="text-zinc-500 text-sm">às</span>
                                <Input
                                    type="time"
                                    value={day.end}
                                    onChange={(e) => updateDay(index, { end: e.target.value })}
                                    className="w-24 h-8 bg-zinc-900 border-zinc-800"
                                />
                            </div>
                        ) : (
                            <div className="flex-1 text-center sm:text-left sm:pl-4">
                                <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Fechado</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
