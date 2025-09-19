"use client";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/lightswind/card";
import { Alert, AlertDescription } from "@/components/lightswind/alert";


export function SignInForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const isMobile = useIsMobile();


  const getErrorMessage = (error: string) => {
    switch (error) {
      case "OAuthSignin":
        return "Error al conectar con el proveedor de autenticación.";
      case "OAuthCallback":
        return "Error en el callback del proveedor.";
      case "OAuthCreateAccount":
        return "No se pudo crear la cuenta.";
      case "EmailCreateAccount":
        return "No se pudo crear la cuenta con este email.";
      case "Callback":
        return "Error en el proceso de autenticación.";
      case "OAuthAccountNotLinked":
        return "Esta cuenta ya está asociada con otro método de inicio de sesión.";
      case "EmailSignin":
        return "Error al enviar el email de verificación.";
      case "CredentialsSignin":
        return "Credenciales incorrectas.";
      case "SessionRequired":
        return "Debes iniciar sesión para acceder a esta página.";
      default:
        return "Ha ocurrido un error durante el inicio de sesión.";
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:justify-center md:gap-16 h-screen max-h-screen mb-5">
      {/* Logo Section */}
      <div className="flex flex-col gap-8 mt-10 md:mt-0">
        {!isMobile && (
          <div className="relative lg:w-[400px] lg:h-[200px] md:w-[350px] md:h-[175px]">
            <Image
              src="/indor_norte_logo.svg"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
        )}
        <div className="relative lg:w-[400px] lg:h-[200px] md:w-[350px] md:h-[175px]">
          <Image
            src="/piramide_logo_title_naranja.svg"
            alt="logo"
            width={400}
            height={200}
            className="drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Sign In Form */}
      <Card className="bg-indor-black shadow-2xl rounded-2xl flex flex-col items-center p-8 w-3/4 lg:w-auto md:w-1/3 backdrop-blur-md border-gray-700">
        <h1 className="text-2xl font-bold text-center text-gray-300 mb-6">
          ¡Bienvenido!
        </h1>
        
        <p className="text-gray-400 text-center mb-8 text-sm">
          Inicia sesión con tu cuenta preferida
        </p>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500 bg-red-950/50">
            <AlertDescription className="text-red-300">
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </Card>
    </div>
  );
}