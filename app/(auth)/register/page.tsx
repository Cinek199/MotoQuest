import AuthRegisterForm from "../../../components/AuthRegisterForm";
import AuthShell from "../../../components/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Nowa przygoda"
      title={<>Dolacz do <span>MotoQuest</span></>}
      subtitle="Utworz profil i wyrusz na pierwsza trase"
    >
      <AuthRegisterForm />
    </AuthShell>
  );
}
