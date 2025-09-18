import HellBackground from "@/components/lightswind/hell-background";
import LoginForm from "./Form"

export default function LoginPage() {
  return (
    <div className="max-h-screen ">
      <HellBackground
        backdropBlurAmount="lg"
        className="fixed"
        color1="#f48a34"
        color2="#2c2c2c"
      />
      <LoginForm />
      </div>
  );
}
