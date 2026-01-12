import { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MemorySectionProps {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    color: string;
}

export const MemorySection = ({ title, icon, children, color }: MemorySectionProps) => {
    return (
        <div className="bg-[#1E1E1E] rounded-xl border border-[#27272a] overflow-hidden flex flex-col h-full">
            <div className={`p-4 border-b border-[#27272a] flex items-center justify-between`} style={{ borderLeft: `4px solid ${color}` }}>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-opacity-20" style={{ backgroundColor: `${color}33`, color }}>
                        {icon}
                    </div>
                    <h3 className="font-semibold text-lg text-white">{title}</h3>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {children}
            </div>
        </div>
    );
};
