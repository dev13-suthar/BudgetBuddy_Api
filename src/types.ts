import z from "zod";

export const registerInputs = z.object({
    name:z.string(),
    email:z.string().email(),
    password:z.string().min(6)
})

export const addMoney = z.object({
    type:z.literal("Credit"),
    amount:z.number(),
    title:z.string(),
    category:z.string(),
})

export const spendMoney = z.object({
    type:z.literal("Debit"),
    amount:z.number(),
    title:z.string(),
    category:z.string(),
})

export interface usersAccount{
     id: number, 
     userId: number, 
     amount: number 
}