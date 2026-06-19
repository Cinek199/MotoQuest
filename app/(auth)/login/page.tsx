import AuthLoginForm from "../../../components/AuthLoginForm";
import AuthShell from "../../../components/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Panel logowania"
      title={<>Witaj w <span>MotoQuest</span></>}
      subtitle="Zaloguj sie i kontynuuj swoja przygode"
    >
      <AuthLoginForm />
    </AuthShell>
  );
}
