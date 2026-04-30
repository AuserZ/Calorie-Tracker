import Card from "./ui/Card";
import { AlertTriangle } from "lucide-react";

export default function MissingConfigNotice() {
  return (
    <div className="p-4 max-w-md mx-auto pt-8">
      <Card className="border-warn/40 bg-warn/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-warn shrink-0 mt-0.5" size={22} />
          <div className="text-sm">
            <h2 className="font-display font-bold text-lg mb-1">
              Firebase not configured
            </h2>
            <p className="text-ink-soft mb-2">
              Add your Firebase web config and Gemini key to{" "}
              <code className="bg-line/60 px-1 py-0.5 rounded text-xs">
                .env.local
              </code>{" "}
              and restart the dev server.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-ink-soft text-xs">
              <li>
                Copy <code>.env.example</code> → <code>.env.local</code>
              </li>
              <li>
                Create a Firebase project, enable Firestore + Storage, paste the
                web SDK config
              </li>
              <li>
                Get a Gemini key from{" "}
                <code>aistudio.google.com/app/apikey</code>
              </li>
              <li>
                Run <code className="bg-line/60 px-1 rounded">npm run dev</code>{" "}
                again
              </li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}
