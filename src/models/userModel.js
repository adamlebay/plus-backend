import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UserModel = {
    createUser: async (data) => {
        return await prisma.user.create({
            data,
        });
    },
    getUserById: async (id) => {
        return await prisma.user.findUnique({
            where: { id },
        });
    },
    updateUser: async (id, data) => {
        return await prisma.user.update({
            where: { id },
            data,
        });
    },
    getAllUsers: async () => {
        return await prisma.user.findMany();
    },
};

export default UserModel;