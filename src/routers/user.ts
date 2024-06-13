import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { registerInputs } from "../types";
import jwt from "jsonwebtoken"
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
const prismaclient = new PrismaClient();


router.post("/register",async(req:Request,res:Response)=>{
    try {
        const {name,password,email} = req.body;
        const parseData = registerInputs.safeParse({name,password,email});
        if(!parseData.success){
            return res.status(411).json({
                message:'incorrect Inputs'
            })
        }
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(parseData.data.password,salt);
       const userwithAccount = await prismaclient.$transaction(async tx=>{
            const user = await tx.user.create({
                data:{
                    password:hashedPassword,
                    emaill:parseData.data.email,
                    name:parseData.data.name
                }
            });

              await tx.account.create({
                data:{
                    userId:user.id
                }
            });
            return user
       })
        res.status(201).json({userwithAccount})
    } catch (error:any) {
        res.status(404).json({
            error:error.message
        })
    }
})

router.post("/signin",async(req:Request,res:Response)=>{
    try {
        const {email,password} = req.body;
        const existUser = await prismaclient.user.findFirst({
            where:{
                emaill:email
            }
        });
        if(!existUser){
            return res.status(411).json({
                message:"Cannot find user with this Email"
            })
        };
        const isMatch = await bcrypt.compare(password,existUser.password);
        if(!isMatch){
            return res.status(403).json({
                message:"Incorrect Password"
            })
        };
        const token = jwt.sign({userId:existUser.id},process.env.JWT_SECRET!!);
        res.status(200).json({token});
    } catch (error:any) {
        res.status(400).json({
            error:error.message
        })
    }
})


export default router