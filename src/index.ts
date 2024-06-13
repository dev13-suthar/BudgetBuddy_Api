import express from "express";
const app = express();
import dotenv from "dotenv"
import cors from "cors"
import userRoutes from "./routers/user"
import transactionRoutes from "./routers/transaction"
import accountRoutes from "./routers/account"
dotenv.config();



app.use(express.json());
app.use(cors());


// Routes
app.use("/v1/user",userRoutes)
app.use("/v1/account",accountRoutes)
app.use("/v1/transaction",transactionRoutes);


const PORT = process.env.PORT || 7001;
app.listen(PORT,()=>console.log(`Server Port:${PORT}`))



