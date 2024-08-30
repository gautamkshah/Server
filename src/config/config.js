import "dotenv/config";
import fastifySession from "@fastify/session";
import  ConnectMongoDBSession from "connect-mongodb-session";
import { Admin } from "../models/index.js";

const MongoDBStore = ConnectMongoDBSession(fastifySession);

export const sessionStore = new MongoDBStore({
  uri: 'mongodb+srv://gautam2002gkp:56BjOscLL4OUvytC@cluster1.are6j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1',
  collection: "sessions",
});

sessionStore.on("error", (error) => {
  console.log("Session store error", error);
});

export const authenticate = async (email,password) =>{
   if(email && password){
       const user= await Admin.findOne({email});
       if(!user ){
            return null;
       }
       if(user.password===password){
        return Promise.resolve({email: user.email, password: user.password});
       }else{
            return null;
       }
   }
   return null;
   
};

export const PORT= process.env.PORT || 3000;
export const COOKIE_PASSWORD= process.env.COOKIE_PASSWORD;