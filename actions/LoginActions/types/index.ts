import { object, string, email } from "zod";

export const LoginSchema = object({
  email: email({
    message: "Ingrese un correo electrónico válido.",
  }),
  password: string().min(1, {
    message: "Contraseña requerida.",
  }),
});

export type CreateProfileData = {
  userId: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl?: string | null;
  password?: string;
};

export type CreateAdminPasswordData = {
  userId: string;
  password: string;
};
