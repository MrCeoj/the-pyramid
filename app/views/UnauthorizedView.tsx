import UserDropdownMenu from "@/components/ui/UserDropdownMenu";

export default function UnauthorizedView({ type }: { type: "no-session" | "user-not-found" }) {
  return (
    <main className="h-screen flex flex-col justify-center items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          {type === "no-session" ? "Acceso no permitido" : "Usuario no encontrado"}
        </h1>
        {type === "no-session" && <p className="mb-4">Inicia sesión para ver una pirámide.</p>}
        <UserDropdownMenu />
      </div>
    </main>
  );
}