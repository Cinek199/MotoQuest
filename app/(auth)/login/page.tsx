import AuthLoginForm from "../../../components/AuthLoginForm";

export default function LoginPage() {
  return (
    <main
      style={{
        background: "#0b0f14",
        color: "white",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <h1>Logowanie</h1>
      <AuthLoginForm />
    </main>
  );
}
