import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, LogOut, User, BarChart3, UploadCloud, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser, clearUser, updatePassword, UserProfile } from "@/lib/auth";
import {
  clearStoredApiKey,
  clearStoredModel,
  getStoredApiKey,
  getStoredModel,
  getStrictMode,
  setStoredApiKey,
  setStoredModel,
  setStrictMode,
} from "@/lib/api";
import { getSavedAnalyses } from "@/pages/History";
import { toast } from "sonner";

const Profile = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [modelInput, setModelInput] = useState(getStoredModel());
  const [hasKey, setHasKey] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strictMode, setStrictModeState] = useState(getStrictMode());

  useEffect(() => {
    setUser(getCurrentUser());
    setHasKey(!!getStoredApiKey());
    setStrictModeState(getStrictMode());
  }, []);

  const analyses = useMemo(() => getSavedAnalyses(user?.email || null), [user?.email]);
  const stats = useMemo(() => {
    const totalAnalyses = analyses.length;
    const totalRows = analyses.reduce((sum, item) => sum + (item.recordCount || 0), 0);
    const personaCounts = analyses.reduce<Record<string, number>>((acc, item) => {
      const key = item.customPersona?.name || item.persona;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topPersonas = Object.entries(personaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { totalAnalyses, totalRows, topPersonas };
  }, [analyses]);

  const handleSaveKey = () => {
    if (!apiKeyInput.trim()) {
      toast.error("Enter a valid API key.");
      return;
    }
    setStoredApiKey(apiKeyInput);
    setApiKeyInput("");
    setHasKey(true);
    setIsEditingKey(false);
    setShowKey(false);
    toast.success("API key saved locally.");
  };

  const handleClearKey = () => {
    clearStoredApiKey();
    setHasKey(false);
    setApiKeyInput("");
    setIsEditingKey(false);
    setShowKey(false);
    toast.success("API key removed.");
  };

  const handleEditKey = () => {
    const stored = getStoredApiKey();
    if (stored) {
      setApiKeyInput(stored);
    }
    setIsEditingKey(true);
    setShowKey(true);
  };

  const handleCancelEdit = () => {
    setApiKeyInput("");
    setIsEditingKey(false);
    setShowKey(false);
  };

  const handleSaveModel = () => {
    if (!modelInput.trim()) {
      toast.error("Enter a model name.");
      return;
    }
    setStoredModel(modelInput);
    toast.success("Model saved locally.");
  };

  const handleClearCache = () => {
    if (!user) return;
    localStorage.removeItem(`insightgen_saved_analyses_${user.email.toLowerCase()}`);
    const cachePrefixes = ["insight_gen_analysis_cache_v1:", "insight_gen_reco_cache_v1:"];
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && cachePrefixes.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
    clearStoredApiKey();
    clearStoredModel();
    setStrictMode(false);
    setStrictModeState(false);
    setHasKey(false);
    toast.success("Local cache cleared.");
  };

  const handleToggleStrictMode = () => {
    const next = !strictMode;
    setStrictMode(next);
    setStrictModeState(next);
    toast.success(`Strict mode ${next ? "enabled" : "disabled"}.`);
  };

  const handlePasswordChange = () => {
    if (!user) return;
    if (!currentPassword || !nextPassword || !confirmPassword) {
      toast.error("Fill in all password fields.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    try {
      updatePassword({
        email: user.email,
        currentPassword,
        nextPassword,
      });
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password update failed.");
    }
  };

  const handleLogout = () => {
    clearUser();
    setUser(null);
    toast.success("Signed out.");
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="glass-card rounded-2xl p-10">
          <User className="w-10 h-10 text-primary mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold mb-3">No profile found</h1>
          <p className="text-muted-foreground mb-6">
            Create a profile to view your analysis stats and manage your API key.
          </p>
          <Button asChild>
            <Link to="/login">Create Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="glass-card rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Profile</p>
          <h1 className="font-display text-3xl font-bold text-foreground">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <BarChart3 className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Datasets cleaned</p>
          <p className="text-2xl font-semibold">{stats.totalAnalyses}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <BarChart3 className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Rows processed</p>
          <p className="text-2xl font-semibold">{stats.totalRows.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <BarChart3 className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Top personas</p>
          {stats.topPersonas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved analyses yet.</p>
          ) : (
            <div className="space-y-1 text-sm">
              {stats.topPersonas.map(([persona, count]) => (
                <div key={persona} className="flex items-center justify-between">
                  <span className="text-foreground">{persona}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">OpenAI API Key</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Your key is stored locally in this browser only.
        </p>
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            type={showKey ? "text" : "password"}
            placeholder="Paste your OpenAI API key"
            value={
              isEditingKey
                ? apiKeyInput
                : hasKey
                  ? showKey
                    ? getStoredApiKey() || ""
                    : "••••••••••••••••"
                  : apiKeyInput
            }
            onChange={(event) => setApiKeyInput(event.target.value)}
            disabled={hasKey && !isEditingKey}
          />
          {isEditingKey || !hasKey ? (
            <>
              <Button className="gap-2" onClick={handleSaveKey}>
                <UploadCloud className="w-4 h-4" />
                Save Key
              </Button>
              {hasKey && (
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowKey((prev) => !prev)}>
                {showKey ? "Hide" : "View"}
              </Button>
              <Button className="gap-2" onClick={handleEditKey}>
                Edit
              </Button>
            </>
          )}
          {hasKey && (
            <Button variant="outline" className="gap-2" onClick={handleClearKey}>
              Remove Key
            </Button>
          )}
        </div>
        {hasKey ? (
          <p className="text-xs text-muted-foreground">Key saved in this browser.</p>
        ) : (
          <p className="text-xs text-muted-foreground">No key saved yet.</p>
        )}
      </div>

      <div className="glass-card rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">OpenAI Model</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose a model that your API key has access to. If incompatible, you will see an error during analysis.
        </p>
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="e.g. gpt-5-chat-latest"
            value={modelInput}
            onChange={(event) => setModelInput(event.target.value)}
          />
          <Button className="gap-2" onClick={handleSaveModel}>
            Save Model
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Current model: {getStoredModel()}</p>
      </div>

      <div className="glass-card rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Strict Analysis Mode</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Reduces hallucination risk using lower temperature and stricter output checks.
        </p>
        <Button variant={strictMode ? "default" : "outline"} onClick={handleToggleStrictMode}>
          {strictMode ? "Strict Mode: ON" : "Strict Mode: OFF"}
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Change Password</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <Input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <Input
            type="password"
            placeholder="New password"
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        <Button variant="outline" onClick={handlePasswordChange}>
          Update Password
        </Button>
        <p className="text-xs text-muted-foreground">
          Passwords are stored locally in this browser only.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-8 space-y-4 border border-destructive/30">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h2 className="font-display text-xl font-semibold text-destructive">Clear Local Cache</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          This removes your saved analyses and local API key on this device only.
        </p>
        <Button variant="destructive" className="gap-2" onClick={handleClearCache}>
          Clear Local Data
        </Button>
      </div>
    </div>
  );
};

export default Profile;
