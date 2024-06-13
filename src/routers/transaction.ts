import { Request, Response, Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { PrismaClient } from "@prisma/client";
import { findingUserAccount } from "../utils";
import { usersAccount } from "../types";

const router = Router();
const prismaclient = new PrismaClient();

interface CategoryMap {
    [key: number]: string;
  }

router.get("/allTransaction",authMiddleware,async(req:Request,res:Response)=>{
    try {
        const userId = req.userId;
        // Findind User Account
        const usersAccount:usersAccount = await findingUserAccount(Number(userId));
        if(!usersAccount){
            return res.status(404).json({
                message:"Cannot find uSers Account"
            })
        }
        const AllTransactions = await prismaclient.transaction.findMany({
            where:{
                account_no:usersAccount.id
            },
            orderBy:{
                createdAt:"asc"
            }

        });
        res.json({AllTransactions});
    } catch (error:any) {
        res.status(400).json({
            error:error.message
        })
    }
})

// TOtal Amount Spent By Each Category
router.get("/stats",authMiddleware,async(req:Request,res:Response)=>{
    const userId = req.userId;
    const totalAmountPerCat = await prismaclient.transaction.groupBy({
        by: ['category_id'],
        _sum: {
          amount: true,
        },
        where: {
        type:"Debit",
          account: {
            userId: Number(userId),
          },
        },
      });

      const catId = totalAmountPerCat.map(grp=>grp.category_id);

      const categories = await prismaclient.category.findMany({
        where:{
            id:{in:catId}
        }
      });

    const categoryMap:CategoryMap= categories.reduce((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {} as CategoryMap);

      const categoryStats = totalAmountPerCat.map(group => ({
        category: categoryMap[group.category_id],
        amount: group._sum.amount,
      }));
    
     res.json({categoryStats})
})
export default router