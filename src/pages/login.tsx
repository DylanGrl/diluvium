import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets } from "lucide-react";

export function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { loginMutation } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const success = await loginMutation.mutateAsync(password);
      setPassword(""); // Clear password from state immediately
      if (success) {
        navigate("/", { replace: true });
      } else {
        setError("Invalid password");
      }
    } catch {
      setPassword("");
      setError("Failed to connect to Deluge");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Droplets className="h-8 w-8 text-brand" />
            Diluvium
          </div>
          <p className="text-sm text-muted-foreground">
            Connect to your Deluge daemon
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter deluge-web password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-state-error">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Connecting..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
