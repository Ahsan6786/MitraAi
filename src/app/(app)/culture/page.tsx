
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { statesData, allIndianStates } from '@/lib/states-data';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const stateImageHints: Record<string, string> = {
    'india': 'India culture',
    'andhra-pradesh': 'Tirupati temple',
    'arunachal-pradesh': 'Tawang monastery',
    'assam': 'tea plantation',
    'bihar': 'Bodhgaya temple',
    'chhattisgarh': 'Chitrakote falls',
    'goa': 'Goa beach',
    'gujarat': 'Rann Utsav',
    'haryana': 'Kurukshetra field',
    'himachal-pradesh': 'Shimla mountains',
    'jammu-and-kashmir': 'Dal Lake',
    'jharkhand': 'Pahari Mandir',
    'karnataka': 'Hampi ruins',
    'kerala': 'Kerala backwaters',
    'madhya-pradesh': 'Khajuraho temple',
    'maharashtra': 'Gateway India',
    'manipur': 'Loktak Lake',
    'meghalaya': 'living root bridge',
    'mizoram': 'Mizoram hills',
    'nagaland': 'Hornbill festival',
    'odisha': 'Konark temple',
    'punjab': 'Golden Temple',
    'rajasthan': 'Hawa Mahal',
    'sikkim': 'Rumtek monastery',
    'tamil-nadu': 'Meenakshi temple',
    'telangana': 'Charminar monument',
    'tripura': 'Ujjayanta Palace',
    'uttar-pradesh': 'Taj Mahal',
    'uttarakhand': 'Kedarnath temple',
    'west-bengal': 'Howrah Bridge'
};


export default function CulturePage() {
    const availableStateIds = new Set(statesData.map(s => s.id));

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Our Culture</h1>
                        <p className="text-sm text-muted-foreground">Explore the rich heritage of India.</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Explore India's Diversity</h1>
                        <p className="mt-2 text-lg text-muted-foreground">Select a state to discover its unique culture, traditions, and beauty.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {allIndianStates.map(state => {
                            const isAvailable = availableStateIds.has(state.id);
                            const placeholderImageUrl = `https://picsum.photos/seed/${state.id}/400/300`;
                            const hint = stateImageHints[state.id] || "India culture";
                            
                            const cardContent = (
                                <Card className={cn(
                                    "group overflow-hidden transition-all duration-300",
                                    isAvailable ? "hover:shadow-lg hover:-translate-y-1" : "opacity-50 cursor-not-allowed"
                                )}>
                                    <CardContent className="p-0">
                                        <div className="relative aspect-[4/3] w-full">
                                            <Image
                                                src={placeholderImageUrl}
                                                alt={`A cultural scene from ${state.name}`}
                                                fill
                                                objectFit="cover"
                                                className="transition-transform duration-300 group-hover:scale-105"
                                                data-ai-hint={hint}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                            <h3 className="absolute bottom-2 left-3 text-white text-base font-bold">{state.name}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            );

                            if (isAvailable) {
                                return (
                                    <Link key={state.id} href={`/culture/${state.id}`} className="block">
                                        {cardContent}
                                    </Link>
                                );
                            }
                            
                            return <div key={state.id}>{cardContent}</div>;
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
