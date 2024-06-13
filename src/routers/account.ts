import { PrismaClient } from "@prisma/client";
import {Request, Response, Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { addMoney, spendMoney, usersAccount } from "../types";
import { findingUserAccount } from "../utils";

const router = Router();
const prismaclient = new PrismaClient();

router.get("/balance",authMiddleware,async(req:Request,res:Response)=>{
    const userId = req.userId;
    const account = await prismaclient.account.findFirst({
        where:{
            userId:Number(userId)
        }
    });
    if(!account){
        res.status(404).json({
            message:"Cannot FInd User's Account"
        })
    };
    const balance = account?.amount;
    res.json({balance});
})

// Credit money into Account
router.post("/add",authMiddleware,async(req:Request,res:Response)=>{
        try {
            const userId = req.userId;
            const {amount,type,title,category} = req.body;
            const parseData = addMoney.safeParse({amount,type,title,category});
            if(!parseData.success){
                console.log(parseData.error?.message)
                return res.status(411).json({
                    message:"Some Error occured"
                });
            };
            const categoryName:string = parseData.data.category
            // Finding Users Account
            const account = await prismaclient.account.findFirst({
                where:{
                    userId:Number(userId)
                }
            });
            if(!account){
                return res.status(404).json({
                    message:"Cannot find User Account, something wrong with userId"
                })
            };

            // Making User Transactions
            const usersTxns = await prismaclient.$transaction(async (tx) => {
                const newCat = await tx.category.upsert({
                    where:{
                        name:categoryName.toString(),
                    },
                    update:{},
                    create:{name:categoryName.toString()}
                })
              //  First creating Transaction
              const txns = await tx.transaction.create({
                data: {
                  amount: parseData.data.amount,
                  type: parseData.data.type,
                  account_no: account.id,
                  title:parseData.data.title,
                  category_id:newCat.id
                },
              });

              // Updating account according to transaction
              const updatAccount = await tx.account.update({
                where: {
                  userId: Number(userId),
                },
                data: {
                  amount: {
                    increment: txns.amount,
                  },
                },
                select:{
                    transactions:true,
                    amount:true,
                }
              });
              return updatAccount;
            });

            res.status(201).json({usersTxns});
        } catch (error:any) {
            res.status(404).json({
                error:error.message
            })
        }
})

// Debit Money from Account;
router.post("/spend",authMiddleware,async(req:Request,res:Response)=>{
    try {
        const userId = req.userId
        const {type,amount,title,category} = req.body;
        const parseData = spendMoney.safeParse({type,amount,title,category});
        if(!parseData.success){
            return res.status(411).json({message:"Incorrect Inputs"})
        }
        const categoryName:string = parseData.data?.category
        if(!parseData.success){
            return res.status(411).json({
                message:"Incorrect Inputs"
            })
        };
        //Finding users Account
        const usersAccount:usersAccount = await findingUserAccount(Number(userId));
        if(!usersAccount){
            return res.status(400).json({
                message:"Error finding Account"
            })
        };
        // Checking If User Have Enough Money Or Not
        if(usersAccount.amount<amount){
            return res.status(403).json({
                message:"InSufficient Balance"
            })
        }
        // Making Transactions and Debiting money from Amount;
        const spendTxns = await prismaclient.$transaction(async (tx)=>{
            const newCat = await tx.category.upsert({
                where:{
                    name:categoryName.toString(),
                },
                update:{},
                create:{name:categoryName.toString()}
            })
            const txns = await tx.transaction.create({
                data:{
                    amount:parseData.data.amount,
                    type:parseData.data.type,
                    account_no:usersAccount.id,
                    category_id:newCat.id,
                    title:parseData.data.title
                }
            });
            // Updating Users Account
            const updateAccount = await tx.account.update({
                where:{
                    userId:Number(userId)
                },
                data:{
                    amount:{
                        decrement:txns.amount
                    }
                },
                select:{
                    transactions:true,
                    amount:true,
                }
            })
            return updateAccount;
        })
        res.status(201).json({spendTxns})
    } catch (error:any) {
        res.status(400).json({
            error:error.message
        })
    }
})

// Check Total Expenses
router.get("/income",authMiddleware,async(req:Request,res:Response)=>{
    try {
        const userId = req.userId;
        // Finding users Account
        const usersAccount = await prismaclient.account.findFirst({
            where:{
                userId:Number(userId)
            }
        });
        // If there is no account
        if(!usersAccount){
            return res.status(404).json({
                message:"Cannot find Account "
            })
        };
        const incomeTxns = await prismaclient.transaction.findMany({
            where:{
                account_no:usersAccount.id,
                type:"Credit"
            }
        });
        const TotalMoney = incomeTxns.reduce((acc,amountt)=>acc+amountt.amount,0);
        res.json({TotalMoney});
    } catch (error:any) {
        res.status(400).json({
            error:error.message
        })
    }
})

// check total Expense
router.get("/expenses",authMiddleware,async(req:Request,res:Response)=>{
    try {
        const userId = req.userId;
        // Finding users Account;
        const usersAccount = await prismaclient.account.findFirst({
            where:{
                userId:Number(userId)
            }
        });
        if(!usersAccount){
            return res.status(404).json({
                message:"Cannot find users Account"
            })
        };
        const ExpensesTxns = await prismaclient.transaction.findMany({
            where:{
                account_no:usersAccount.id,
                type:"Debit"
            }
        });
        const totalAmount = ExpensesTxns.reduce((acc,amount)=>acc+amount.amount,0);
        res.json({totalAmount});
    } catch (error:any) {
        res.status(404).json({
            message:error.message
        })
    }
})
export default router