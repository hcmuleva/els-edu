
import React, { useState } from 'react';
import { useLogin, useNotify } from 'react-admin';
import { Link } from 'react-router-dom';

const MyLoginPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const login = useLogin();
    const notify = useNotify();

    const handleSubmit = e => {
        e.preventDefault();
        login({ username: identifier, password }).catch(() =>
            notify('Invalid username or password')
        );
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
             <div className="w-full max-w-md bg-card p-8 rounded-3xl border border-border/50 shadow-xl animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                     <h2 className="text-3xl font-black text-foreground font-heading mb-2">Welcome Back!</h2>
                     <p className="text-muted-foreground">Sign in to continue your journey</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Username or Email</label>
                        <input
                            name="identifier"
                            type="text"
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary/10 border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            placeholder="Enter your username"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-bold text-foreground mb-2">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary/10 border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Sign In
                    </button>
                    
                     <div className="text-center mt-6">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary font-bold hover:underline">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </form>
             </div>
        </div>
    );
};

export default MyLoginPage;
