
'use client';

import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquarePlus, Users } from 'lucide-react';
import Link from 'next/link';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]); // Placeholder for group data

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Group Chats
            </h1>
            <p className="text-sm text-muted-foreground">
              Connect and chat with your friends.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GenZToggle />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Groups</h2>
            <Button>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>

          {groups.length === 0 ? (
            <Card className="text-center p-6 md:p-10 border-dashed">
              <CardHeader>
                <CardTitle>No Groups Yet</CardTitle>
                <CardDescription>
                  You haven't joined or created any groups. Create one to start chatting with friends!
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Group cards will be mapped here later */}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
