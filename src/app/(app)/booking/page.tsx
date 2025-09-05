
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarPlus, Mail, Phone, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { GenZToggle } from '@/components/genz-toggle';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Counsellor {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

const issueTypes = [
    "Stress",
    "Depression",
    "Academic Pressure",
    "Relationship Issues",
    "Sleep Issues",
    "Other"
];

// Generates a user-friendly random code
const generateStudentCode = () => {
    const adjectives = ["Brave", "Calm", "Wise", "Kind", "Strong", "Happy", "Proud"];
    const nouns = ["Lion", "Eagle", "River", "Star", "Tree", "Fox", "Wolf"];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(100 + Math.random() * 900);
    return `${adjective}${noun}${number}`;
}


function BookingDialog({ counsellor, user, isOpen, onOpenChange }: { counsellor: Counsellor | null, user: any, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [ampm, setAmPm] = useState('');
    const [issueType, setIssueType] = useState('');
    const [notes, setNotes] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { toast } = useToast();

    const resetForm = () => {
        setDate(undefined);
        setHour('');
        setMinute('');
        setAmPm('');
        setIssueType('');
        setNotes('');
        setIsAnonymous(false);
    };

    const handleBooking = async () => {
        if (!counsellor || !user || !date || !hour || !minute || !ampm || !issueType) {
            toast({ title: 'Please fill all required fields.', variant: 'destructive' });
            return;
        }
        setIsBooking(true);
        try {
            const time = `${hour}:${minute} ${ampm}`;
            const studentCode = isAnonymous ? generateStudentCode() : null;

            await addDoc(collection(db, 'bookings'), {
                student_id: isAnonymous ? null : user.uid,
                student_email: isAnonymous ? null : user.email,
                student_phone: isAnonymous ? null : (user.phoneNumber || null),
                student_code: studentCode,
                counsellor_id: counsellor.id,
                counsellor_name: counsellor.name,
                counsellor_email: counsellor.email,
                counsellor_avatar: counsellor.avatarUrl || null,
                appointment_date: format(date, 'yyyy-MM-dd'),
                appointment_time: time,
                appointment_status: 'Pending',
                is_anonymous: isAnonymous,
                issue_type: issueType,
                meet_link: null,
                student_notes: notes,
                counsellor_notes: null,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            });
            
            let toastDescription = 'Your request has been sent to the counsellor.';
            if (isAnonymous && studentCode) {
                toastDescription += ` Your anonymous code is ${studentCode}. Please save it.`
            }

            toast({ title: 'Appointment Booked!', description: toastDescription });
            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error('Error booking appointment:', error);
            toast({ title: 'Booking Failed', variant: 'destructive' });
        } finally {
            setIsBooking(false);
        }
    };

    if (!counsellor) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Book with {counsellor.name}</DialogTitle>
                    <DialogDescription>
                        Select a date and time for your appointment.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="flex items-center space-x-2">
                        <Switch id="anonymous-mode" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                        <Label htmlFor="anonymous-mode">Book Anonymously</Label>
                    </div>
                    {isAnonymous && (
                        <div className="flex items-start gap-3 rounded-md border border-amber-500 bg-amber-50 p-3 dark:bg-amber-950/20">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600"/>
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                Your name and email will be hidden. You will receive a unique code to track your appointment.
                            </p>
                        </div>
                    )}
                    <Select onValueChange={setIssueType} value={issueType}>
                        <SelectTrigger><SelectValue placeholder="Select type of issue" /></SelectTrigger>
                        <SelectContent>
                            {issueTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(selectedDate) => {
                                    setDate(selectedDate);
                                    setIsCalendarOpen(false);
                                }}
                                disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <div className="grid grid-cols-3 gap-2">
                        <Select onValueChange={setHour} value={hour}>
                            <SelectTrigger><SelectValue placeholder="Hour" /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => <SelectItem key={i+1} value={(i + 1).toString().padStart(2, '0')}>{(i + 1).toString().padStart(2, '0')}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={setMinute} value={minute}>
                            <SelectTrigger><SelectValue placeholder="Minute" /></SelectTrigger>
                            <SelectContent>
                                {['00', '15', '30', '45'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={setAmPm} value={ampm}>
                            <SelectTrigger><SelectValue placeholder="AM/PM" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AM">AM</SelectItem>
                                <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Textarea placeholder="Add a note for the counsellor (optional)..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBooking}>Cancel</Button>
                    <Button type="submit" onClick={handleBooking} disabled={isBooking}>
                        {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Booking
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function BookingPage() {
    const { user } = useAuth();
    const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const fetchCounsellors = async () => {
            try {
                const q = query(collection(db, 'counsellors'), where('status', '==', 'approved'));
                const querySnapshot = await getDocs(q);
                const counsellorsData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Use a consistent, friendly male cartoon avatar for all counsellors
                    const avatarUrl = 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg';
                    return { id: doc.id, ...data, avatarUrl } as Counsellor
                });
                setCounsellors(counsellorsData);
            } catch (error) {
                console.error("Error fetching counsellors:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounsellors();
    }, []);

    const handleBookClick = (counsellor: Counsellor) => {
        setSelectedCounsellor(counsellor);
        setIsDialogOpen(true);
    };
    
    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">Book an Appointment</h1>
                      <p className="text-sm text-muted-foreground">
                          Connect with our professional counsellors.
                      </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                 {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : counsellors.length === 0 ? (
                    <Card className="text-center p-6 md:p-10">
                        <CalendarPlus className="mx-auto w-12 h-12 text-muted-foreground mb-4"/>
                         <CardTitle>No Counsellors Available</CardTitle>
                        <CardDescription className="mt-2 max-w-sm mx-auto">
                            We're sorry, there are currently no counsellors available for booking. Please check back later.
                        </CardDescription>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {counsellors.map(c => (
                            <Card key={c.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-16 h-16">
                                            <AvatarImage src={c.avatarUrl} alt={c.name} />
                                            <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle>{c.name}</CardTitle>
                                            <CardDescription>Professional Counsellor</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-2">
                                     <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4" /><span>{c.email}</span></div>
                                     <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4" /><span>{c.phone}</span></div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => handleBookClick(c)}>Book an Appointment</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
             <BookingDialog 
                counsellor={selectedCounsellor}
                user={user}
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
             />
        </div>
    );
}
