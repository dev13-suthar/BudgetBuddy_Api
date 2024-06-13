import { PrismaClient } from "@prisma/client"

const prismaclient = new PrismaClient();
export const findingUserAccount = async(userId:number)=>{
    try {
        const usersAccount = await prismaclient.account.findFirst({
            where:{
                userId:userId
            }
        });
        if(!usersAccount){
            throw new Error("Cannot find Users Account")
        }
        return usersAccount;
    } catch (error:any) {
        return error.message
    }
}