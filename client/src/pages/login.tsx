import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/firebase";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user && !authLoading) {
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      await login(values.email, values.password);
      // Navigation handled by useEffect
    } catch (error: any) {
      console.error(error);
      // Format error message professionally
      let errorMessage = "Authentication failed. Please verify your credentials.";
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "The credentials provided do not match our records. Please verify your email and password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Access temporarily suspended due to multiple failed attempts. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.3),rgba(0,0,0,0))]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-pulse duration-10000" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse duration-7000 delay-1000" />

      <div className="w-full max-w-md p-6 relative z-10">
        {/* Glass Card */}
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group">
          
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="p-8 pb-6 text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
              <img 
                src="https://res.cloudinary.com/ddtbj3hej/image/upload/v1757174586/BackgroundEraser_20250906_184426881_xl7mhj.png" 
                alt="ZetuBridge Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white font-display">
                ZetuBridge
              </h1>
              <p className="text-white/50 text-sm">
                Enter your credentials to access the asset manager
              </p>
            </div>
          </div>

          <div className="p-8 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative group/input">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-white/40 group-focus-within/input:text-blue-400 transition-colors" />
                          <Input 
                            placeholder="admin@zetubridge.com" 
                            className="pl-10 h-11 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-black/40 focus:border-blue-500/50 transition-all rounded-xl" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Password</FormLabel>
                      <FormControl>
                        <div className="relative group/input">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40 group-focus-within/input:text-blue-400 transition-colors" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 h-11 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-black/40 focus:border-blue-500/50 transition-all rounded-xl" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {loginError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                    <div className="flex gap-3">
                      <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-red-400">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-red-200 font-medium leading-relaxed">
                        {loginError}
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/25 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
          
          <div className="p-4 bg-white/5 border-t border-white/5 text-center">
            <p className="text-xs text-white/30">
              Authorized personnel only. Protected by ZetuBridge Security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
