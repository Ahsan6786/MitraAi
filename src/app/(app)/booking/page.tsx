
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarPlus, Mail, Phone, Calendar as CalendarIcon } from 'lucide-react';
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

interface Counsellor {
  id: string;
  name: string;
  email: string;
  phone: string;
}

function BookingDialog({ counsellor, user, isOpen, onOpenChange }: { counsellor: Counsellor | null, user: any, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [ampm, setAmPm] = useState('');
    const [notes, setNotes] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const { toast } = useToast();

    const resetForm = () => {
        setDate(undefined);
        setHour('');
        setMinute('');
        setAmPm('');
        setNotes('');
    };

    const handleBooking = async () => {
        if (!counsellor || !user || !date || !hour || !minute || !ampm) {
            toast({ title: 'Please fill all required fields.', variant: 'destructive' });
            return;
        }
        setIsBooking(true);
        try {
            const time = `${hour}:${minute} ${ampm}`;
            
            await addDoc(collection(db, 'bookings'), {
                student_id: user.uid,
                student_email: user.email,
                student_phone: user.phoneNumber || null,
                counsellor_id: counsellor.id,
                counsellor_name: counsellor.name,
                counsellor_email: counsellor.email,
                appointment_date: format(date, 'yyyy-MM-dd'),
                appointment_time: time,
                appointment_status: 'Pending',
                meet_link: null,
                student_notes: notes,
                counsellor_notes: null,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            });

            toast({ title: 'Appointment Booked!', description: 'Your request has been sent to the counsellor.' });
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
                    <Popover>
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
                                onSelect={setDate}
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
                const counsellorsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Counsellor));
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
                <ThemeToggle />
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
