import { AuthGate } from "@/components/authGate";
import { OnboardingGate } from "@/components/onboardingGate";
import { SecretNotes } from "@/components/secretNotes";

export default function Home() {
  return (
    <AuthGate>
      <OnboardingGate>
        <SecretNotes />
      </OnboardingGate>
    </AuthGate>
  );
}
