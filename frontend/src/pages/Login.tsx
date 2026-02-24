import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticateUser, registerUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleSignup = (event: React.FormEvent) => {
    event.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      registerUser({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
      });
      toast.success("Account created. Welcome!");
      navigate("/profile");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed.");
    }
  };

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      authenticateUser({ email: loginEmail.trim(), password: loginPassword });
      toast.success("Welcome back!");
      navigate("/profile");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed.");
    }
  };

  const handleDemo = () => {
    navigate("/profile");
  };

  return (
    <div className="relative">
      <div className="relative py-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(173_80%_45%/0.1),transparent_50%)]" />
        <div className="relative max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <LogIn className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Sign in or Sign up</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Access Your Profile
          </h1>
          <p className="text-lg text-muted-foreground">
            Your profile is stored locally in this browser. Use the same device to keep your history.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 pb-20">
        <Tabs defaultValue="login" className="glass-card rounded-2xl p-8">
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
              >
                Sign In
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full name</Label>
                <Input
                  id="signup-name"
                  placeholder="Enter your name"
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
              >
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground mt-4 text-center">
          Demo mode only. Credentials are stored locally in this browser.
          <Button variant="link" className="px-1 text-xs" onClick={handleDemo}>
            Continue to profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
