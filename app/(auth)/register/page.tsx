import AuthRegisterForm from "../../../components/AuthRegisterForm";
import AuthShell from "../../../components/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Panel rejestracji"
      title={<>Dolacz do <span>MotoQuest</span></>}
      subtitle="Utworz konto i zacznij odkrywac swiat"
    >
      <AuthRegisterForm />
    </AuthShell>
  );
}
