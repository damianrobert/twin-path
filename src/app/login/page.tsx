'use client';

import React from 'react';
import { useAuth } from '@/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import Image from 'next/image';

const Login = () => {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center h-screen py-96">
        <Logo />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Button className= "p-6 cursor-pointer" onClick={signInWithGoogle}>Sign in with Google
                    <Image
                        src="/google-logo-search-new-svgrepo-com.svg"
                        alt="Logo"
                        width={40}
                        height={10}
                        priority
                    />
                </Button>

            </div>
        </div>
    );
};

export default Login;
