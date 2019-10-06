import express,{Request,Response} from "express";
const app = express();

app.get("/",(req:Request,res:Response)=>{
    res.end("hello espress");
})

export {app};
