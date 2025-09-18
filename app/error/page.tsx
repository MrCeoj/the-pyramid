"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/lightswind/button";
import { Card } from "@/components/lightswind/card";
import { Alert, AlertDescription } from "@/components/lightswind/alert";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorDetails = (errorType: string | null) => {
    switch (errorType) {
      case "Configuration":
        return {
          title: "Error de configuración",
          message: "Hay un problema con la configuración del servidor. Por favor, contacta al administrador.",
          canRetry: false,
        };
      case "AccessDenied":
        return {
          title: "Acceso denegado",
          message: "No tienes permisos para acceder a esta aplicación.",
          canRetry: false,
        };
      case "Verification":
        return {
          title: "Error de verificación",
          message: "El enlace de verificación no es válido o ha expirado.",
          canRetry: true,
        };
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
        return {
          title: "Error de autenticación",
          message: "Ha ocurrido un error al intentar conectar con el proveedor de autenticación. Por favor, intenta de nuevo.",
          canRetry: true,
        };
      case "EmailCreateAccount":
        return {
          title: "Error al crear cuenta",
          message: "No se pudo crear la cuenta con este email. Es posible que ya esté en uso.",
          canRetry: true,
        };
      case "Callback":
        return {
          title: "Error de callback",
          message: "Ha ocurrido un error durante el proceso de autenticación.",
          canRetry: true,
        };
      case "OAuthAccountNotLinked":
        return {
          title: "Cuenta no vinculada",
          message: "Esta cuenta ya está asociada con otro método de inicio de sesión. Intenta con el método que usaste originalmente.",
          canRetry: true,
        };
      case "EmailSignin":
        return {
          title: "Error de email",
          message: "No se pudo enviar el email de verificación. Verifica tu dirección de correo.",
          canRetry: true,
        };
      case "CredentialsSignin":
        return {
          title: "Credenciales incorrectas",
          message: "Los datos proporcionados no son correctos. Verifica tu información e intenta de nuevo.",
          canRetry: true,
        };
      case "SessionRequired":
        return {
          title: "Sesión requerida",
          message: "Debes iniciar sesión para acceder a esta página.",
          canRetry: true,
        };
      default:
        return {
          title: "Error desconocido",
          message: "Ha ocurrido un error inesperado. Por favor, intenta de nuevo más tarde.",
          canRetry: true,
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Card className="w-full max-w-md bg-indor-black shadow-2xl rounded-2xl p-8 backdrop-blur-md border-gray-700">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-10 mx-auto mb-6">
            <Image
              src="/piramide_logo_naranja.svg"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-gray-300 mb-2">
            {errorDetails.title}
          </h1>
        </div>

        {/* Error Message */}
        <Alert className="mb-6 border-red-500 bg-red-950/50">
          <AlertDescription className="text-red-300 text-center">
            {errorDetails.message}
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="space-y-4">
          {errorDetails.canRetry && (
            <Link href="/auth/signin" className="block">
              <Button className="w-full bg-orange-vivid hover:bg-orange-dense text-white font-semibold py-3 rounded-xl">
                Volver a intentar
              </Button>
            </Link>
          )}
          
          <Link href="/" className="block">
            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 py-3 rounded-xl"
            >
              Ir al inicio
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            Si el problema persiste, contacta al administrador del sistema.
          </p>
          {error && (
            <p className="text-gray-600 text-xs mt-2">
              Código de error: {error}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-orange-vivid border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}