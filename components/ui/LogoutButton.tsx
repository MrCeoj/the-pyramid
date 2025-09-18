import { LogOut } from "lucide-react";

export default function LogoutButton({logout}) {
  return (
    <button className="fixed right-7 p-3 rounded-full bg-indor-black top-5 xl:top-auto xl:bottom-5 hover:cursor-pointer" onClick={logout}>
      <LogOut color="white" strokeWidth={2} />
    </button>
  );
}
