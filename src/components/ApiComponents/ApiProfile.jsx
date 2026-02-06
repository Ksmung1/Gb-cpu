import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { db } from "../../configs/firebase";
import { doc, updateDoc } from "firebase/firestore";
const ApiProfile = () => {
  const { user, setUser } = useUser();
  const profile = user;

  const [error, setError] = useState("");
  const isApiUser = user.role === "admin" || user?.role === 'api';
  const isAdmin = user?.role === "admin";
  const [showKey, setShowKey] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [generating, setGenerating] = useState(false);

  // --- Helper: generate random API key on frontend ---
  const generateApiKey = () => {
    const bytes = new Uint8Array(24);
    // crypto is available in browser
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
    return `GB-${hex}`; // e.g. "GBR-..." ~ 51 chars
  };

  const handleCopy = async () => {
    if (!profile?.apiKey) return;
    try {
      await navigator.clipboard.writeText(profile.apiKey);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 1500);
    } catch (err) {
      console.error(err);
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(""), 1500);
    }
  };

const handleGenerateKey = async () => {
  // Only admins can generate their own API keys
  if (!isAdmin) {
    setError("Only administrators can generate API keys. Please contact an admin to generate your API key.");
    return;
  }

  try {
    setGenerating(true);
    setError("");

    const newKey = generateApiKey();

    // 1️⃣ Firestore document reference
    const userRef = doc(db, "users", user.uid);

    // 2️⃣ Save to Firestore
    await updateDoc(userRef, {
      apiKey: newKey,
      apiKeyGeneratedAt: new Date().toISOString(),
    });

    // 3️⃣ Update UI (local user context)
    setUser((prev) => ({
      ...prev,
      apiKey: newKey,
    }));

  } catch (err) {
    console.error(err);
    setError("Failed to generate API key.");
  } finally {
    setGenerating(false);
  }
};


  if (error) {
    return (
      <div className="mt-10 px-4 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mt-10 px-4 text-black">
        <p>No profile data found.</p>
      </div>
    );
  }



  const maskedKey =
    profile.apiKey && profile.apiKey.length > 8
      ? profile.apiKey.slice(0, 4) +
        "••••••••" +
        profile.apiKey.slice(-4)
      : "••••••••••••";

  return (
    <div className="mt-10 px-4 text-black max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Profile</h1>

      <div className="space-y-4">
        {/* Username */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500">Username</div>
          <div className="text-lg font-semibold mt-1">
            {profile.username || "-"}
          </div>
        </div>

        {/* UID */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500">UID</div>
          <div className="text-lg font-semibold mt-1">
            {profile.uid || "-"}
          </div>
        </div>

        {/* API Key */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm text-gray-500">API Key</div>
              <div className="text-xs text-gray-500">
                Keep this secret. Do not share publicly.
              </div>
            </div>

            {/* Generate button (only admins can generate, and only if no apiKey yet) */}
          {!profile.apiKey && isAdmin && (
              <button
                onClick={handleGenerateKey}
                disabled={generating}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate API Key"}
              </button>
            )}
          {!profile.apiKey && isApiUser && !isAdmin && (
              <div className="px-3 py-2 text-sm bg-gray-200 text-gray-600 rounded-lg">
                Contact admin to generate API key
              </div>
            )}
          </div>

          {profile.apiKey && isApiUser && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 font-mono bg-gray-100 px-3 py-2 rounded border text-sm overflow-x-auto">
                {showKey ? profile.apiKey : maskedKey}
              </div>

              {/* Eye button */}
              <button
                onClick={() => setShowKey((prev) => !prev)}
                className="p-2 rounded border bg-white hover:bg-gray-50"
                title={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? "🙈" : "👁️"}
              </button>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
          )}

          {copyStatus && (
            <div className="mt-1 text-xs text-green-600">{copyStatus}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiProfile;
