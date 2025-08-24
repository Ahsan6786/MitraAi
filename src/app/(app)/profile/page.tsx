
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, addDoc, deleteDoc, writeBatch, getDocs, setDoc } from 'firebase/firestore';
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Loader2, Trash2, PlusCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const trustedContactSchema = z.object({
  email: z.string().email({ message: "Invalid email address." })
});

const profileSafetySchema = z.object({
  consentForAlerts: z.boolean().default(false),
  trustedContacts: z.array(trustedContactSchema).max(3, "You can add up to 3 trusted contacts."),
});

type ProfileSafetyForm = z.infer<typeof profileSafetySchema>;

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    
    const form = useForm<ProfileSafetyForm>({
        resolver: zodResolver(profileSafetySchema),
        defaultValues: {
            consentForAlerts: false,
            trustedContacts: [],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "trustedContacts",
    });

    const loadProfileData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            const userProfileSnap = await getDoc(userProfileRef);

            if (userProfileSnap.exists()) {
                form.setValue('consentForAlerts', userProfileSnap.data().consentForAlerts || false);
            }
            
            const contactsCollectionRef = collection(db, 'userProfiles', user.uid, 'trustedContacts');
            const unsubscribe = onSnapshot(contactsCollectionRef, (querySnapshot) => {
                const contacts = querySnapshot.docs.map(doc => ({ email: doc.data().email }));
                replace(contacts); // Use replace to update the field array
                setIsLoading(false);
            }, (error) => {
                 console.error("Error fetching contacts:", error);
                 toast({ title: "Error", description: "Could not fetch trusted contacts.", variant: "destructive" });
                 setIsLoading(false);
            });

            return unsubscribe;

        } catch (error) {
            console.error("Error loading profile data:", error);
            toast({ title: "Error", description: "Could not load your profile settings.", variant: "destructive" });
            setIsLoading(false);
        }
    }, [user, form, toast, replace]);

    useEffect(() => {
        const unsubscribePromise = loadProfileData();
        return () => {
            unsubscribePromise?.then(unsubscribe => unsubscribe && unsubscribe());
        }
    }, [loadProfileData]);


    const onSubmit: SubmitHandler<ProfileSafetyForm> = async (data) => {
        if (!user) return;
        
        form.formState.isSubmitting = true;

        try {
            // 1. Update the consent field in the user's profile document
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            await setDoc(userProfileRef, { consentForAlerts: data.consentForAlerts }, { merge: true });

            // 2. Sync the trusted contacts subcollection
            const contactsCollectionRef = collection(db, 'userProfiles', user.uid, 'trustedContacts');
            const contactsSnapshot = await getDocs(contactsCollectionRef);
            
            // Start a batch write to delete old contacts and add new ones atomically
            const batch = writeBatch(db);
            
            // Delete all existing contacts
            contactsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Add the new contacts from the form data
            data.trustedContacts.forEach((contact) => {
                if (contact.email) { 
                    const newContactRef = doc(contactsCollectionRef); // Create a new doc ref
                    batch.set(newContactRef, { email: contact.email });
                }
            });
            
            // Commit the batch write
            await batch.commit();

            toast({ title: "Success", description: "Your profile and safety settings have been updated." });
        } catch (error) {
            console.error("Error updating settings:", error);
            toast({ title: "Error", description: "Failed to update your settings. Please try again.", variant: "destructive" });
        } finally {
             // Manually setting isSubmitting to false in a timeout to ensure state update
            setTimeout(() => {
                form.clearErrors();
                const isSubmitting = 'isSubmitting' as keyof typeof form.formState;
                (form.formState[isSubmitting] as boolean) = false;
                form.trigger();
            }, 500);
        }
    };
    
    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                 <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <div>
                  <h1 className="text-lg md:text-xl font-bold">Profile & Safety</h1>
                  <p className="text-sm text-muted-foreground">
                      Manage your trusted contacts and safety preferences.
                  </p>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle>Crisis Alerts</CardTitle>
                                <CardDescription>
                                   In case our AI detects a high risk of self-harm in your messages, we can notify a trusted contact. Your privacy is important; we will never share the content of your messages.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="consentForAlerts"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Enable Trusted Contact Alerts</FormLabel>
                                                <FormDescription>
                                                    Allow us to email your trusted contact if you mention suicidal thoughts.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <CardTitle>Trusted Contacts</CardTitle>
                                <CardDescription>
                                   Add the email addresses of friends or family you trust. We will notify them if crisis alerts are enabled and triggered.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {fields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={form.control}
                                        name={`trustedContacts.${index}.email`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contact Email #{index + 1}</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input placeholder="friend@example.com" {...field} />
                                                    </FormControl>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}

                                 <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ email: "" })}
                                    disabled={fields.length >= 3}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Contact
                                </Button>
                                <FormMessage>{form.formState.errors.trustedContacts?.root?.message}</FormMessage>
                                
                                {form.getValues('consentForAlerts') && fields.length === 0 && (
                                     <div className="flex items-start text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                         <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" />
                                         <span>You have enabled crisis alerts but have not added any trusted contacts. Please add at least one contact.</span>
                                     </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                     {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </main>
        </div>
    );
}
