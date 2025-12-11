"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/lightswind/button";
import { Card } from "@/components/lightswind/card";
import { Input } from "@/components/lightswind/input";
import { Label } from "@/components/lightswind/label";
import { login } from "@/actions/LoginActions";
import { createNewUserAndProfile } from "@/actions/ProfileManagementActions";
import toast from "react-hot-toast";

export default function SignupForm({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (error !== null && error !== "") toast.error(error);
  }, [error]);

  const [formData, setFormData] = useState({
    email: email,
    firstName: "",
    lastName: "",
    nickname: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (error) setError(null);
  };

  // --- MODIFIED SUBMIT HANDLER ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.firstName.trim() || !formData.password.trim()) {
      setError(
        "El nombre, primer apellido, correo y contraseña son obligatorios."
      );
      return;
    }

    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    startTransition(async () => {
      const password = formData.password.replaceAll(" ", "");
      try {
        // 1. Create the profile and set the password
        const createResult = await createNewUserAndProfile({
          email: formData.email,
          paternalSurname: formData.firstName,
          maternalSurname: formData.lastName,
          password: password,
          role: "player",
          nickname: formData.nickname,
        });

        if (!createResult.success) {
          setError(createResult.error || "Error al crear el perfil.");
          return;
        }

        toast.success("¡Perfil completado! Iniciando sesión...");

        const loginResult = await login({
          email: email,
          password: password,
        });

        if (loginResult?.error) {
          setError(loginResult.error);
          router.push("/login");
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log(err);
          setError(err.message);
        }
      }
    });
  };

  const handleNicknameChange = (value: string) => {
    const sanitizedValue = sanitizeNickname(value);
    setFormData((prev) => ({
      ...prev,
      nickname: sanitizedValue,
    }));
  };

  const sanitizeNickname = (value: string): string => {
    return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <Card className="flex flex-col items-center w-full max-w-md max-h-[95%] overflow-auto bg-indor-black shadow-2xl rounded-2xl p-8 backdrop-blur-md border border-gray-700">
        <div className="relative w-60 h-32 aspect-[15/8]">
          <Image
            src="/indor_norte_logo.svg"
            alt="Logo Indor Norte"
            fill
            className="object-contain"
            priority
          />
        </div>

        <h1 className=" font-bold text-xl my-4">¡Completa tu perfil!</h1>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className=" font-medium">
                Nombre*
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                className="mt-1 bg-white text-black"
                placeholder="Tu nombre"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className=" font-medium">
                Primer Apellido*
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                className="mt-1 bg-white text-black"
                placeholder="Tu primer apellido"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nickname" className="font-medium">
              Correo electrónico*
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 bg-white text-black"
              placeholder="Tu correo electrónico"
              required
              disabled={isPending}
            />
          </div>

          <div className="border-b pb-4 border-b-gray-200/40">
            <Label htmlFor="nickname" className="te font-medium">
              Apodo (opcional)
            </Label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded text-black"
              placeholder="¿Cómo te gustaría que te llamen?"
              maxLength={10}
              disabled={isPending}
            />
            <div className="text-xs text-gray-400 mt-1">
              {formData.nickname.length}/10 caracteres
            </div>
          </div>

          <div>
            <Label htmlFor="password" className=" font-medium">
              Crea una contraseña*
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 bg-white text-black"
              placeholder="Contraseña segura"
              required
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === " ") {
                  e.preventDefault();
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className=" font-medium">
              Confirma tu contraseña*
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="mt-1 bg-white text-black"
              placeholder="Confirma tu contraseña"
              required
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === " ") {
                  e.preventDefault();
                }
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-orange-vivid hover:bg-orange-dense text-white font-semibold py-3 rounded-xl shadow-md transition-colors"
          >
            {isPending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creando perfil...</span>
              </div>
            ) : (
              "Completar perfil y entrar"
            )}
          </Button>
        </form>

        <p className="text-gray-500 text-xs text-center mt-6">
          * Campos obligatorios
        </p>
      </Card>
    </div>
  );
}
