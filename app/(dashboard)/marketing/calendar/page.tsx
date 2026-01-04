"use client";

import { useState, useEffect } from "react";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { MarketingCalendar, CalendarEvent } from "@/components/marketing/calendar/MarketingCalendar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

// Mock Data for initial view
const MOCK_EVENTS: CalendarEvent[] = [
    {
        id: "1",
        title: "Blog: AI Trends 2025",
        start: new Date(new Date().setHours(10, 0, 0, 0)),
        end: new Date(new Date().setHours(11, 0, 0, 0)),
        type: "blog"
    },
    {
        id: "2",
        title: "Newsletter: Product Update",
        start: new Date(new Date().setDate(new Date().getDate() + 2)),
        end: new Date(new Date().setDate(new Date().getDate() + 2)),
        type: "email"
    }
];

export default function ContentCalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", type: "blog" as const, date: "" });

    // Fetch Events (TODO: Connect to Firestore getContentCalendar)
    // useEffect(() => { ... }, []);

    const handleAddEvent = () => {
        if (!newEvent.title || !newEvent.date) return toast.error("Please fill all fields");

        const start = new Date(newEvent.date);
        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        const event: CalendarEvent = {
            id: crypto.randomUUID(),
            title: newEvent.title,
            start,
            end,
            type: newEvent.type
        };

        setEvents([...events, event]);
        setIsDialogOpen(false);
        setNewEvent({ title: "", type: "blog", date: "" });
        toast.success("Event scheduled");
    };

    return (
        <MarketingLayout
            title="Content Calendar"
            description="Plan and schedule your marketing activities."
            actions={
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Schedule Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Schedule New Content</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title / Topic</Label>
                                <Input
                                    placeholder="e.g. Q4 Marketing Strategy"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={newEvent.type}
                                    onValueChange={(v: any) => setNewEvent({ ...newEvent, type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="blog">Blog Post</SelectItem>
                                        <SelectItem value="social">Social Media</SelectItem>
                                        <SelectItem value="email">Email Campaign</SelectItem>
                                        <SelectItem value="ad">Ad Campaign</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Date & Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={newEvent.date}
                                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                />
                            </div>
                            <Button onClick={handleAddEvent} className="w-full">Schedule</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            }
        >
            <MarketingCalendar events={events} />
        </MarketingLayout>
    );
}
