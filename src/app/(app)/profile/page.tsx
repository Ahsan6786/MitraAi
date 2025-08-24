
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<ProfileSafetyForm>({
        resolver: zodResolver(profileSafetySchema),
        defaultValues: {
            consentForAlerts: false,
            trustedContacts: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "trustedContacts",
    });

    const loadProfileData = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const userProfileRef = doc(db, 'userProfiles', userId);
            const contactsCollectionRef = collection(db, 'userProfiles', userId, 'trustedContacts');

            const [profileSnap, contactsSnap] = await Promise.all([
                getDoc(userProfileRef),
                getDocs(contactsCollectionRef)
            ]);

            const profileData = profileSnap.exists() ? profileSnap.data() : { consentForAlerts: false };
            const contactsData = contactsSnap.docs.map(doc => ({ email: doc.data().email }));

            form.reset({
                consentForAlerts: profileData.consentForAlerts,
                trustedContacts: contactsData,
            });

        } catch (error) {
            console.error("Error loading profile data:", error);
            toast({ title: "Error", description: "Could not load your profile settings.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [form, toast]);


    useEffect(() => {
        if (user) {
            loadProfileData(user.uid);
        } else {
            setIsLoading(false);
        }
    }, [user, loadProfileData]);


    const onSubmit: SubmitHandler<ProfileSafetyForm> = async (data) => {
        if (!user) return;
        
        setIsSubmitting(true);

        try {
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            const contactsCollectionRef = collection(db, 'userProfiles', user.uid, 'trustedContacts');
            
            // 1. Set the consent status. Creates the document if it doesn't exist.
            await setDoc(userProfileRef, { consentForAlerts: data.consentForAlerts }, { merge: true });

            // 2. Sync trusted contacts
            const batch = writeBatch(db);
            const existingContactsSnap = await getDocs(contactsCollectionRef);
            
            // Delete all existing contacts
            existingContactsSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Add the new contacts from the form
            data.trustedContacts.forEach((contact) => {
                if (contact.email) { 
                    const newContactRef = doc(contactsCollectionRef);
                    batch.set(newContactRef, { email: contact.email });
                }
            });
            
            await batch.commit();

            toast({ title: "Success", description: "Your profile and safety settings have been updated." });
            // Reload data to ensure form is in sync with DB state
            await loadProfileData(user.uid);

        } catch (error) {
            console.error("Error updating settings:", error);
            toast({ title: "Error", description: "Failed to update your settings. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
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
                                
                                {form.watch('consentForAlerts') && fields.length === 0 && (
                                     <div className="flex items-start text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                         <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" />
                                         <span>You have enabled crisis alerts but have not added any trusted contacts. Please add at least one contact.</span>
                                     </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
