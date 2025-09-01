
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Loader2, CalendarClock, CheckCircle, Clock, XCircle, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Booking {
    id: string;
    counsellor_name: string;
    appointment_date: string;
    appointment_time: string;
    appointment_status: 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled';
    counsellor_notes?: string;
    createdAt: Timestamp;
}

const StatusInfo = ({ status }: { status: Booking['appointment_status'] }) => {
    switch (status) {
        case 'Confirmed':
            return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1"/>Confirmed</Badge>;
        case 'Rejected':
            return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/>Rejected</Badge>;
        case 'Cancelled':
            return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"><Ban className="w-3 h-3 mr-1"/>Cancelled</Badge>;
        case 'Pending':
        default:
            return <Badge variant="outline"><Clock className="w-3 h-3 mr-1"/>Pending</Badge>;
    }
}

export default function MyAppointmentsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState<string | null>(null);

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
        setIsCancelling(bookingId);
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                appointment_status: 'Cancelled'
            });
            toast({ title: "Appointment Cancelled", description: "Your booking has been successfully cancelled." });
        } catch (error) {
            console.error("Error cancelling booking: ", error);
            toast({ title: "Error", description: "Could not cancel the appointment.", variant: "destructive" });
        } finally {
            setIsCancelling(null);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">My Appointments</h1>
                        <p className="text-sm text-muted-foreground">
                            Track the status of your counsellor bookings.
                        </p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                <div className="max-w-3xl mx-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : bookings.length === 0 ? (
                        <Card className="text-center p-6 md:p-10">
                            <CalendarClock className="mx-auto w-12 h-12 text-muted-foreground mb-4"/>
                            <CardTitle>No Appointments Yet</CardTitle>
                            <CardDescription className="mt-2">
                                You haven't booked any appointments. <Link href="/booking" className="text-primary underline">Book one now</Link>.
                            </CardDescription>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map(booking => (
                                <Card key={booking.id} className={cn((booking.appointment_status === 'Rejected' || booking.appointment_status === 'Cancelled') && 'bg-muted/50')}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{booking.counsellor_name}</CardTitle>
                                                <CardDescription>
                                                    {booking.appointment_date} at {booking.appointment_time}
                                                </CardDescription>
                                            </div>
                                            <StatusInfo status={booking.appointment_status} />
                                        </div>
                                    </CardHeader>
                                    {booking.counsellor_notes && (
                                        <CardContent>
                                            <p className="text-sm font-semibold">Message from Counsellor:</p>
                                            <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md whitespace-pre-wrap mt-1">{booking.counsellor_notes}</p>
                                        </CardContent>
                                    )}
                                    {(booking.appointment_status === 'Pending' || booking.appointment_status === 'Confirmed') && (
                                        <CardFooter>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" disabled={isCancelling === booking.id}>
                                                        {isCancelling === booking.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Cancel Appointment
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will cancel your appointment with {booking.counsellor_name}.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Back</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleCancelBooking(booking.id)}>Confirm Cancellation</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </CardFooter>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
