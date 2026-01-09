'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"

export default function Home() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h1>Welcome, {user?.displayName}</h1>
          <Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={logout}>Logout</Button>
        </div>
      ) : null}
    </div>
  );
}
