"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/lightswind/button";
import { Card } from "@/components/lightswind/card";
import { Input } from "@/components/lightswind/input";
import { Label } from "@/components/lightswind/label";
import { updateProfile, login } from "@/actions/LoginActions";// Assuming actions are in the same folder
import toast from "react-hot-toast";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ProfileSetupFormProps {
  user: User;
}

export function ProfileSetupForm({ user }: ProfileSetupFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if(error !== null && error !== "") toast.error(error)
  }, [error])

  const nameParts = user.name?.split(" ") || [];
  const [formData, setFormData] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    nickname: "",
    password: "",
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
      setError("El primer apellido y la contraseña son obligatorios.");
      return;
    }

    startTransition(async () => {
      const password = formData.password.replaceAll(" ", "");
      try {
        
        // 1. Create the profile and set the password
        const createResult = await updateProfile({
          userId: user.id,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          nickname: formData.nickname.trim() || null,
          avatarUrl: user.image,
          password: password,
        });

        if (!createResult.success) {
          setError(createResult.error || "Error al crear el perfil.");
          return;
        }

        toast.success("¡Perfil completado! Iniciando sesión...");
        
      } catch (err) {
        if (err instanceof Error){
          console.log(err)
          setError(err.message)
        }
      } finally {
        const loginResult = await login({
          email: user.email!,
          password: password,
        });

        if (loginResult?.error) {
          setError(loginResult.error);
          router.push("/login");
        }
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <Card className="flex flex-col items-center w-full max-w-md bg-indor-black shadow-2xl rounded-2xl p-8 backdrop-blur-md border border-gray-700">
        <div className="relative w-60 h-32">
          <Image
            src="/indor_norte_logo.svg"
            alt="Logo Indor Norte"
            layout="fill"
            objectFit="contain"
          />
        </div>

        <h1 className=" font-bold text-xl my-4">
          ¡Completa tu perfil!
        </h1>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className=" font-medium">
                Primer apellido*
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                className="mt-1 bg-white text-black"
                placeholder="Tu primer apellido"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className=" font-medium">
                Segundo apellido
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                className="mt-1 bg-white text-black"
                placeholder="Tu segundo apellido"
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nickname" className="te font-medium">
              Apodo (opcional)
            </Label>
            <Input
              id="nickname"
              type="text"
              value={formData.nickname}
              onChange={handleInputChange}
              className="mt-1 bg-white text-black"
              placeholder="¿Cómo te gusta que te llamen?"
              disabled={isPending}
            />
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