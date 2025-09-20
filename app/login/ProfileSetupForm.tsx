"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/lightswind/button";
import { Card } from "@/components/lightswind/card";
import { Input } from "@/components/lightswind/input";
import { Label } from "@/components/lightswind/label";
import { Alert, AlertDescription } from "@/components/lightswind/alert";
import { Avatar } from "@/components/lightswind/avatar";
import { createProfile, login } from "./actions";
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
  const router = useRouter(); // Use the useRouter hook for client-side navigation

  const nameParts = user.name?.split(" ") || [];
  const [formData, setFormData] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    nickname: "",
    password: "", // Add password to state
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.password.trim()) {
      setError("El nombre y la contraseña son obligatorios");
      return;
    }

    startTransition(async () => {
      try {
        const psswd = formData.password.replaceAll(" ", "");
        const result = await createProfile({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          nickname: formData.nickname.trim() || null,
          avatarUrl: user.image,
          password: psswd,
          userId: user.id,
        });

        if (result.success) {
          // This client-side redirect allows the session to update before navigating
          console.log("SEPUDO");
          const result = await login({
            email: user.email!,
            password: psswd,
          });
          if (result?.error){
            toast.success("Usuario creado")
          }
          router.refresh();
        } else {
          setError(result.error || "Error al crear el perfil");
        }
      } catch (error) {
        console.error("Profile creation error:", error);
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
            alt="La pirAMide"
            layout="fill"
            objectFit="contain"
            className="drop-shadow-black drop-shadow-2xl"
          />
        </div>

        <h1 className="text-white font-bold text-xl my-4">
          ¡Completa tu perfil!
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-white font-medium">
                Nombre *
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="mt-1 bg-white/90 border-gray-300 focus:ring-2 focus:ring-orange-vivid"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-white font-medium">
                Apellido
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="mt-1 bg-white/90 border-gray-300 focus:ring-2 focus:ring-orange-vivid"
                placeholder="Tu apellido"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nickname" className="text-white font-medium">
              Apodo (opcional)
            </Label>
            <Input
              id="nickname"
              type="text"
              value={formData.nickname}
              onChange={(e) => handleInputChange("nickname", e.target.value)}
              className="mt-1 bg-white/90 border-gray-300 focus:ring-2 focus:ring-orange-vivid"
              placeholder="¿Cómo te gusta que te llamen?"
            />
          </div>

          {/* New password input */}
          <div>
            <Label htmlFor="password" className="text-white font-medium">
              Crea una contraseña *
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="mt-1 bg-white/90 border-gray-300 focus:ring-2 focus:ring-orange-vivid"
              placeholder="Contraseña segura"
              required
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
              "Completar perfil"
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
