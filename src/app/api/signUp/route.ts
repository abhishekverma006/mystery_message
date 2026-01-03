import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from 'bcryptjs'

import {sendVerificationEmail} from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
    await dbConnect();

    try {
        const {username, email, password} = await request.json();

        // Check if user already exists
        const existingUser = await UserModel.findOne({
            username,
            isVerified: true
        });
        if (existingUser) {
            return Response.json({
                success: false,
                message: 'Username is already taken.',
            }, {status: 400});
        }
        
        const existingEmail = await UserModel.findOne({email});

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit code

        if(existingEmail){
            if(existingEmail.isVerified){
                return Response.json({
                    success: false,
                    message: 'Email is already registered.',
                }, {status: 400});
            }else{
                // Update existing unverified user with new details
                const expiryDate = new Date();
                expiryDate.setHours(expiryDate.getHours() + 1); // Set expiry to 1 hour from now

                const hashedPassword = await bcrypt.hash(password, 10);
                existingEmail.password = hashedPassword;
                existingEmail.username = username;
                existingEmail.verifyCode = verifyCode;
                existingEmail.verifyCodeExpiry = expiryDate;

                await existingEmail.save();
            }
        }
        else{
            const hashedPassword = await bcrypt.hash(password, 10);
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1); // Set expiry to 1 hour from now

            const newUser = new UserModel({
                username,
                email,
                password: hashedPassword,
                isVerified: false,
                verifyCode: verifyCode,
                verifyCodeExpiry: expiryDate,
                isAcceptingMessage: true,
                messages: [],
            });

            await newUser.save();
        }


        // send verification email
        const emailResponse = await sendVerificationEmail(email, username, verifyCode);

        if(!emailResponse.success){
            return Response.json({
                success: false,
                message: emailResponse.message,
            }, {status: 500});
        }

        return Response.json({
            success: true,
            message: 'User registered successfully. Verification email sent.',
        }, {status: 201});
    }
    catch(error){
        console.error('Error during sign up:', error);
        return Response.json({
            success: false,
            message: 'Error registering user.',
        }, {status: 500});
    }
}

