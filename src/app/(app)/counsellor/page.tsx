
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { Loader2, UserCheck, CalendarClock, Check, X, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Booking {
    id: string;
    student_email: string;
    appointment_date: string;
    appointment_time: string;
    appointment_status: 'Pending' | 'Confirmed' | 'Rejected';
    student_notes?: string;
    meet_link?: string;
    createdAt: Timestamp;
}

function BookingList() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [meetLink, setMeetLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'bookings'),
            where('counsellor_id', '==', user.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            bookingsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setBookings(bookingsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleManageClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setMeetLink(booking.meet_link || '');
        setIsModalOpen(true);
    };

    const handleUpdateBooking = async (status: 'Confirmed' | 'Rejected') => {
        if (!selectedBooking) return;
        setIsSubmitting(true);
        try {
            const bookingRef = doc(db, 'bookings', selectedBooking.id);
            await updateDoc(bookingRef, {
                appointment_status: status,
                meet_link: meetLink,
                updated_at: Timestamp.now(),
            });
            toast({ title: `Booking ${status}` });
            setIsModalOpen(false);
            setSelectedBooking(null);
        } catch (error) {
            console.error('Error updating booking:', error);
            toast({ title: 'Update failed', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    const pendingBookings = bookings.filter(b => b.appointment_status === 'Pending');
    const confirmedBookings = bookings.filter(b => b.appointment_status === 'Confirmed');

    return (
        <>
            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                    {pendingBookings.length === 0 ? (
                        <p className="text-muted-foreground text-center py-6">No pending booking requests.</p>
                    ) : (
                        <div className="space-y-4">
                            {pendingBookings.map(booking => (
                                <Card key={booking.id}>
                                    <CardHeader>
                                        <CardTitle className="text-base">Booking Request</CardTitle>
                                        <CardDescription>{booking.student_email}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-2">
                                        <p><strong>Date:</strong> {booking.appointment_date}</p>
                                        <p><strong>Time:</strong> {booking.appointment_time}</p>
                                        {booking.student_notes && <p><strong>Notes:</strong> {booking.student_notes}</p>}
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => handleManageClick(booking)}>Manage</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="confirmed" className="mt-4">
                     {confirmedBookings.length === 0 ? (
                        <p className="text-muted-foreground text-center py-6">No confirmed appointments.</p>
                    ) : (
                         <div className="space-y-4">
                            {confirmedBookings.map(booking => (
                                <Card key={booking.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base">Appointment</CardTitle>
                                            <Badge variant="secondary">Confirmed</Badge>
                                        </div>
                                        <CardDescription>{booking.student_email}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-2">
                                        <p><strong>Date:</strong> {booking.appointment_date}</p>
                                        <p><strong>Time:</strong> {booking.appointment_time}</p>
                                        {booking.meet_link && <p><strong>Meet Link:</strong> <a href={booking.meet_link} target="_blank" rel="noopener noreferrer" className="text-primary underline">{booking.meet_link}</a></p>}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Booking Request</DialogTitle>
                        <DialogDescription>
                            Confirm or reject this appointment and provide a meeting link if necessary.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                         <div>
                            <p className="text-sm font-medium">Student: {selectedBooking?.student_email}</p>
                            <p className="text-sm text-muted-foreground">Date & Time: {selectedBooking?.appointment_date} at {selectedBooking?.appointment_time}</p>
                            {selectedBooking?.student_notes && <p className="text-sm text-muted-foreground mt-2 italic">Notes: "{selectedBooking.student_notes}"</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meet-link">Message / Meet Link</Label>
                            <Textarea
                                id="meet-link"
                                placeholder="e.g., https://meet.google.com/xyz-abc-def or a confirmation message."
                                value={meetLink}
                                onChange={(e) => setMeetLink(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleUpdateBooking('Rejected')} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X className="mr-2 h-4 w-4" />}
                            Reject
                        </Button>
                        <Button onClick={() => handleUpdateBooking('Confirmed')} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default function CounsellorPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/counsellor-signin');
            return;
        }

        const checkCounsellorStatus = async () => {
            const counsellorDoc = await getDoc(doc(db, 'counsellors', user.uid));
            if (!counsellorDoc.exists() || counsellorDoc.data().status !== 'approved') {
                // This might be too aggressive if there's a delay in doc creation.
                // But for now, it ensures only approved counsellors get in.
                await auth.signOut(); // Log out invalid user
                router.push('/counsellor-signin');
            }
        };

        checkCounsellorStatus();
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold flex items-center gap-2"><UserCheck className="w-6 h-6 text-primary"/>Counsellor Panel</h1>
                        <p className="text-sm text-muted-foreground">Welcome, {user.displayName}</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <CalendarClock className="w-5 h-5"/>
                           Your Appointments
                        </CardTitle>
                        <CardDescription>Review pending requests and manage your schedule.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BookingList />
                    </CardContent>
                 </Card>
            </main>
        </div>
    );
}
