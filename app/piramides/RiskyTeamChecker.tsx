"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/lightswind/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { checkAndMarkRiskyTeams } from "@/actions/TeamsActions";
import toast from "react-hot-toast";

export function RiskyTeamsChecker({ pyramidId }: { pyramidId: number }) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<RiskyCheckResult | null>(null);
  useEffect(() => {
    if (result?.success) toast.success("Validados todos los inactivos.");
  }, [result]);

  const handleCheck = async () => {
    setIsChecking(true);
    setResult(null);

    try {
      const checkResult = await checkAndMarkRiskyTeams(pyramidId);
      setResult(checkResult);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setResult({
        success: false,
        message: "Error inesperado al verificar equipos",
        teamsMarkedRisky: 0,
        emailsSent: 0,
        emailsFailed: 0,
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex flex-row-reverse justify-between w-full mb-2 gap-2">
      <div className="space-y-4">
        <Button
          onClick={handleCheck}
          disabled={isChecking}
          variant="outline"
          className="bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Verificar Inactivos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
