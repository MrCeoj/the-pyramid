"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/lightswind/button";
import { Card } from "@/components/lightswind/card";
import { Input } from "@/components/lightswind/input";
import { Label } from "@/components/lightswind/label";
import { createAdminPassword, login } from "@/actions/LoginActions";
import toast from "react-hot-toast";

interface PasswordSetupFormProps {
  user: User;
}

export function PasswordSetupForm({ user }: PasswordSetupFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("La contraseña es obligatoria");
      return;
    }

    startTransition(async () => {
      try {
        const cleanPass = password.replaceAll(" ", "");
        const result = await createAdminPassword({
          userId: user.id,
          password: cleanPass,
        });

        if (result.success) {
          toast.success("Contraseña creada");

          // Auto-login after password creation
          const loginResult = await login({
            email: user.email!,
            password: cleanPass,
          });

          if (loginResult?.error) {
            toast.error("Hubo un problema iniciando sesión");
          }

          router.refresh();
        } else {
          setError(result.error || "Error al crear la contraseña");
        }
      } catch (err) {
        console.error("Password setup error:", err);
        setError("Ha ocurrido un error inesperado");
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="flex flex-col items-center w-full bg-indor-black shadow-2xl rounded-2xl p-8 backdrop-blur-md border-gray-700">
        <div className="relative w-60 h-32">
          <Image
            src="/indor_norte_logo.svg"
            priority
            alt="La pirAMide"
            layout="fill"
            objectFit="contain"
            className="drop-shadow-black drop-shadow-2xl"
          />
        </div>

        <h1 className="text-white font-bold text-xl my-4">
          Configura tu contraseña
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div>
            <Label htmlFor="password" className="text-white font-medium">
              Crea una contraseña *
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className="mt-1 bg-white/90 border-gray-300 focus:ring-2 focus:ring-orange-vivid"
              placeholder="Contraseña segura"
              required
              onKeyDown={(e) => {
                if (e.key === " ") e.preventDefault();
              }}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-semibold">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-orange-vivid hover:bg-orange-dense text-white font-semibold py-3 rounded-xl shadow-md transition-colors"
          >
            {isPending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </div>
            ) : (
              "Guardar contraseña"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
