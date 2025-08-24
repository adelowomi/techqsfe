import { hash } from "bcryptjs";
import { db } from "~/server/db";

export async function createUser(email: string, password: string, name?: string) {
  const hashedPassword = await hash(password, 12);

  try {
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('User with this email already exists');
    }
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  return await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
    },
  });
}
