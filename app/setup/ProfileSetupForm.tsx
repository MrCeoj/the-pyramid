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
import { createProfile } from "./actions";

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

  // Pre-fill form with user data
  const nameParts = user.name?.split(" ") || [];
  const [formData, setFormData] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    nickname: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createProfile({
          userId: user.id,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          nickname: formData.nickname.trim() || null,
          avatarUrl: user.image,
        });

        if (result.success) {
          router.push("/?welcome=true");
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
      <Card className="w-full max-w-md bg-indor-black shadow-2xl rounded-2xl p-8 backdrop-blur-md border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative w-40 h-20 mx-auto mb-1">
            <Image
              src="/piramide_logo_naranja.svg"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-300 mb-2">
            ¡Completa tu perfil!
          </h1>
          <p className="text-gray-400 text-sm">
            Solo necesitamos algunos datos para empezar
          </p>
        </div>

        {/* User Info Display */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <Avatar className="w-12 h-12">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-orange-vivid flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </Avatar>
          <div>
            <p className="text-white font-medium">{user.name}</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500 bg-red-950/50">
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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