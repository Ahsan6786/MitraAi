
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Loader2, CheckCircle, Clock, XCircle, Ban, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenZToggle } from '@/components/genz-toggle';

interface Booking {
    id: string;
    counsellor_name: string;
    counsellor_avatar?: string;
    appointment_date: string;
    appointment_time: string;
    appointment_status: 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled';
    createdAt: Timestamp;
}

const AppointmentCard = ({ booking, onCancel }: { booking: Booking, onCancel: (id: string) => void }) => {
    const { toast } = useToast();
    
    const handleBookAgain = () => {
        // In a real app, you might pass counsellor ID to pre-fill the booking page
        toast({ title: "Redirecting to booking page..." });
        // router.push('/booking');
    }

    // Fallback avatar if one isn't provided in the booking document
    const avatarUrl = booking.counsellor_avatar || 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg';

    return (
        <div className="bg-card rounded-lg border p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
                <Avatar className="w-16 h-16">
                    <AvatarImage src={avatarUrl} alt={booking.counsellor_name} />
                    <AvatarFallback>{booking.counsellor_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-foreground text-lg font-bold">{booking.counsellor_name}</h3>
                    <p className="text-muted-foreground text-sm">
                        {booking.appointment_status === 'Pending' ? `Session requested for: ` : ''}
                        {booking.appointment_date} at {booking.appointment_time}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {booking.appointment_status === 'Pending' && <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-300"><Clock className="w-3 h-3 mr-1.5"/>Pending</Badge>}
                {booking.appointment_status === 'Confirmed' && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-300"><CheckCircle className="w-3 h-3 mr-1.5"/>Confirmed</Badge>}
                {booking.appointment_status === 'Rejected' && <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1.5"/>Rejected</Badge>}
                {booking.appointment_status === 'Cancelled' && <Badge variant="outline"><Ban className="w-3 h-3 mr-1.5"/>Cancelled</Badge>}
            </div>
             <div className="flex items-center gap-4 w-full md:w-auto">
                {booking.appointment_status === 'Pending' && (
                    <>
                        <Button variant="ghost" size="sm" onClick={() => onCancel(booking.id)}>Cancel Request</Button>
                        <Button variant="secondary" size="sm">View Details</Button>
                    </>
                )}
                 {booking.appointment_status === 'Confirmed' && (
                    <>
                        <Button variant="ghost" size="sm">Reschedule</Button>
                        <Button size="sm">Join Session</Button>
                    </>
                )}
                 {booking.appointment_status === 'Rejected' && (
                     <>
                        <Button variant="secondary" size="sm">View Details</Button>
                        <Button size="sm" asChild><Link href="/booking">Book Again</Link></Button>
                    </>
                )}
                {booking.appointment_status === 'Cancelled' && (
                    <Button size="sm" asChild><Link href="/booking">Book Again</Link></Button>
                )}
            </div>
        </div>
    )
}


export default function MyAppointmentsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'bookings'),
            where('student_id', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            setBookings(bookingsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCancelBooking = async (bookingId: string) => {
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                appointment_status: 'Cancelled'
            });
            toast({ title: "Appointment Cancelled", description: "Your booking has been successfully cancelled." });
        } catch (error) {
            console.error("Error cancelling booking: ", error);
            toast({ title: "Error", description: "Could not cancel the appointment.", variant: "destructive" });
        }
    };

    const upcomingBookings = bookings.filter(b => b.appointment_status === 'Pending' || b.appointment_status === 'Confirmed');
    const pastBookings = bookings.filter(b => b.appointment_status === 'Rejected' || b.appointment_status === 'Cancelled');
    
    const pending = upcomingBookings.filter(b => b.appointment_status === 'Pending');
    const confirmed = upcomingBookings.filter(b => b.appointment_status === 'Confirmed');


    return (
        <div className="h-full flex flex-col bg-muted/30">
            <header className="border-b bg-background p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">My Appointments</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your upcoming and past counseling sessions.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                <div className="max-w-5xl mx-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                         <Tabs defaultValue="upcoming" className="w-full">
                            <TabsList className="bg-transparent p-0 border-b rounded-none w-full justify-start">
                                <TabsTrigger value="upcoming" className="data-[state=active]:border-primary data-[state=inactive]:border-transparent border-b-2 rounded-none shadow-none bg-transparent data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground">Upcoming</TabsTrigger>
                                <TabsTrigger value="past" className="data-[state=active]:border-primary data-[state=inactive]:border-transparent border-b-2 rounded-none shadow-none bg-transparent data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground">Past</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upcoming" className="mt-6">
                                {upcomingBookings.length === 0 ? (
                                    <div className="text-center py-10">
                                        <CalendarClock className="mx-auto w-12 h-12 text-muted-foreground mb-4"/>
                                        <h3 className="text-xl font-semibold">No Upcoming Appointments</h3>
                                        <p className="text-muted-foreground mt-2">You have no pending or confirmed appointments.</p>
                                        <Button asChild className="mt-4"><Link href="/booking">Book a Session</Link></Button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {pending.length > 0 && (
                                            <div>
                                                <h2 className="text-lg font-semibold text-foreground mb-4">Pending Confirmation</h2>
                                                <div className="space-y-4">
                                                    {pending.map(booking => <AppointmentCard key={booking.id} booking={booking} onCancel={handleCancelBooking} />)}
                                                </div>
                                            </div>
                                        )}
                                        {confirmed.length > 0 && (
                                            <div>
                                                <h2 className="text-lg font-semibold text-foreground mb-4">Confirmed</h2>
                                                <div className="space-y-4">
                                                    {confirmed.map(booking => <AppointmentCard key={booking.id} booking={booking} onCancel={handleCancelBooking} />)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="past" className="mt-6">
                               {pastBookings.length === 0 ? (
                                    <div className="text-center py-10">
                                        <CalendarClock className="mx-auto w-12 h-12 text-muted-foreground mb-4"/>
                                        <h3 className="text-xl font-semibold">No Past Appointments</h3>
                                        <p className="text-muted-foreground mt-2">Your past appointment history will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {pastBookings.map(booking => <AppointmentCard key={booking.id} booking={booking} onCancel={handleCancelBooking} />)}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </main>
        </div>
    );
}
