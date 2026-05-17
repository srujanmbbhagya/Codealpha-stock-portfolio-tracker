import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Phone, ShieldCheck, ArrowRight, ArrowLeft, Sparkles, User, Lock, AtSign, Eye, EyeOff,
} from "lucide-react";

import { useAuth } from "@/lib/auth-store";
import { sendOtpSms } from "@/lib/send-otp.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — WealthLens.ai" },
      { name: "description", content: "Login or create your WealthLens.ai account with username/password or mobile OTP." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup";
type Method = "password" | "otp";
type OtpStep = "phone" | "otp";

function AuthPage() {
  const navigate = useNavigate();
  const requestOtp = useAuth((s) => s.requestOtp);
  const verifyOtp = useAuth((s) => s.verifyOtp);
  const signupWithPassword = useAuth((s) => s.signupWithPassword);
  const loginWithPassword = useAuth((s) => s.loginWithPassword);
  const pending = useAuth((s) => s.pendingOtp);
  const sendSms = useServerFn(sendOtpSms);

  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<Method>("password");

  // Password fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // OTP fields
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [country, setCountry] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    const res =
      mode === "signup"
        ? signupWithPassword({ name, username, password })
        : loginWithPassword({ username, password });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(mode === "signup" ? "Welcome to WealthLens!" : "Welcome back!");
    navigate({ to: "/" });
  };

  const handleSendOtp = async () => {
    setLoading(true);
    const fullPhone = `${country}${phone.replace(/^0+/, "")}`;
    const res = requestOtp({ phone: fullPhone, mode, name });
    if (!res.ok) {
      setLoading(false);
      toast.error(res.error);
      return;
    }
    try {
      const sms = await sendSms({ data: { phone: fullPhone, code: res.code } });
      if (sms.delivered) {
        toast.success(`OTP sent to ${country} ${phone}`, {
          description: "Check your SMS messages.",
          duration: 6000,
        });
      } else {
        toast.success(`Demo OTP for ${country} ${phone}`, {
          description: `${sms.message} Code: ${res.code}`,
          duration: 10000,
        });
      }
    } catch (e) {
      console.error(e);
      toast.success(`Demo OTP for ${country} ${phone}`, {
        description: `Code: ${res.code}`,
        duration: 10000,
      });
    }
    setLoading(false);
    setOtpStep("otp");
  };

  const handleVerify = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    const res = verifyOtp(otp);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(mode === "signup" ? "Welcome to WealthLens!" : "Welcome back!");
    navigate({ to: "/" });
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setOtpStep("phone");
    setOtp("");
  };

  const switchMethod = (m: Method) => {
    setMethod(m);
    setOtpStep("phone");
    setOtp("");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-info/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md card-grad rounded-3xl p-6 sm:p-8 border border-border/50 shadow-2xl"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-primary mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Secure authentication
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "login"
            ? "Log in to track and grow your portfolio."
            : "Start mastering your investments in seconds."}
        </p>

        {/* Login / Signup switcher */}
        <div className="mt-6 grid grid-cols-2 gap-1 p-1 glass rounded-full">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`text-sm font-medium py-2 rounded-full transition ${
                mode === m
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Method switcher */}
        <div className="mt-3 grid grid-cols-2 gap-1 p-1 rounded-xl border border-border/50">
          {(
            [
              { k: "password", label: "Username & Password", Icon: Lock },
              { k: "otp", label: "Mobile OTP", Icon: Phone },
            ] as const
          ).map(({ k, label, Icon }) => (
            <button
              key={k}
              onClick={() => switchMethod(k)}
              className={`flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition ${
                method === k
                  ? "bg-accent/60 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {method === "password" ? (
            <motion.div
              key={`pwd-${mode}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 space-y-4"
            >
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Investor"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="jane_investor"
                    className="pl-9 h-11 lowercase"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                    className="pl-9 pr-10 h-11"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handlePasswordSubmit}
                disabled={loading || !username || !password || (mode === "signup" && !name)}
                className="w-full h-11 rounded-xl text-base font-semibold"
              >
                {loading ? "Please wait…" : mode === "signup" ? "Create Account" : "Log In"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : otpStep === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-6 space-y-4"
            >
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="otp-name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Investor"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile number</Label>
                <div className="flex gap-2">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="h-11 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+65">🇸🇬 +65</option>
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="pl-9 h-11 font-mono tracking-wider"
                      maxLength={12}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  We'll text a 6-digit code to this number.
                </p>
              </div>

              <Button
                onClick={handleSendOtp}
                disabled={loading || phone.length < 8}
                className="w-full h-11 rounded-xl text-base font-semibold"
              >
                {loading ? "Sending OTP…" : "Send OTP"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-6 space-y-5"
            >
              <div className="flex items-start gap-3 p-3 rounded-xl glass">
                <ShieldCheck className="h-5 w-5 text-profit shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-medium">Code sent to {country} {phone}</div>
                  <div className="text-muted-foreground mt-0.5">
                    Enter the 6-digit OTP. Valid for 5 minutes.
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-12 w-11 text-lg font-semibold first:rounded-l-lg last:rounded-r-lg"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {pending && (
                  <button
                    onClick={() => toast.info("Demo OTP", { description: pending.code, duration: 6000 })}
                    className="text-[11px] text-muted-foreground hover:text-primary underline underline-offset-2"
                  >
                    Show demo code
                  </button>
                )}
              </div>

              <Button
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                className="w-full h-11 rounded-xl text-base font-semibold"
              >
                {loading ? "Verifying…" : mode === "signup" ? "Create Account" : "Log In"}
                <ArrowRight className="h-4 w-4" />
              </Button>

              <button
                onClick={() => setOtpStep("phone")}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Change number or resend
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          By continuing, you agree to WealthLens.ai's Terms & Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
