import AuthLoginForm from "../../../components/AuthLoginForm";
import AuthShell from "../../../components/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Panel kierowcy"
      title={<>Witaj w <span>MotoQuest</span></>}
      subtitle="Odkrywaj swiat motocyklem"
    >
      <AuthLoginForm />
    </AuthShell>
  );
}
