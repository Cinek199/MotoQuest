import AuthRegisterForm from "../../../components/AuthRegisterForm";

export default function RegisterPage() {
  return (
    <main
      style={{
        background: "#0b0f14",
        color: "white",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <h1>Rejestracja</h1>
      <AuthRegisterForm />
    </main>
  );
}
