import { AuthGate } from "@/components/authGate";
import { SecretNotes } from "@/components/secretNotes";

export default function Home() {
  return (
    <AuthGate>
      <SecretNotes />
    </AuthGate>
  );
}
