"use client";
import { useRouter } from "next/navigation";

export default function NavAdmin() {
  const router = useRouter();
  const redirectToPyramids = () => {
    router.push("/admin/piramides");
  };
  const redirectToPerfiles = () => {
    router.push("/admin/perfiles");
  };
  const redirectToEquipos = () => {
    router.push("/admin/equipos");
  };
  const redirectToRetas = () => {
    router.push("/admin/retas");
  };

  return (
    <div className="flex justify-around">
      <button onClick={redirectToPyramids}>Piramides</button>
      <button onClick={redirectToPerfiles}>perfiles</button>
      <button onClick={redirectToEquipos}>equipos</button>
      <button onClick={redirectToRetas}>retas</button>
    </div>
  );
}
