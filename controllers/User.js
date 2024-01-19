import { User } from "../models/users.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from 'cloudinary';
import fs, { fsync } from 'fs';


// craete user

export const register = async (req, res) => {
    try {

        const { name, email, password } = req.body;

        const avatar = req.files.avatar.tempFilePath;
        // console.log(avatar)


        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ success: false, message: "User already exists" })
        }

        const otp = Math.floor(Math.random() * 1000000)

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "Native APP",
        })

        fs.rmSync("./tmp", { recursive: true });


        user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            },
            otp,
            otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
        });


        await sendEmail({
            email: user.email,
            subject: "Verify Your Email",
            message: `Your otp is ${otp}`
        });

        sendToken(
            res,
            user,
            201,
            "OTP sent to your mail, please verify your account"
        );
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

//verify user

export const verify = async (req, res) => {
    try {
        const otp = Number(req.body.otp);
        const user = await User.findById(req.user._id);

        if (user.otp !== otp || user.otp_expiry < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid OTP or has been  expired." });
        }

        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;

        await user.save();

        sendToken(
            res,
            user,
            200,
            "Account Verified",
        );

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// login user

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Enter Email and Password" });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password" })
        }

        sendToken(
            res,
            user,
            200,
            "Login Successfuly"
        );
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}



// logout user

export const logout = async (req, res) => {
    try {
        res.
            status(200).
            cookie("token", null, {
                expires: new Date(Date.now()),

            }).
            json({
                success: true,
                message: "Logged out",
            });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};


// Get  user Profile

export const getMyProfile = async (req, res) => {
    try {

        const user = await User.findById(req.user._id);

        sendToken(
            res,
            user,
            201,
            `Welcome back ${user.name} `
        );
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};

// Update user Profile

export const updateProfile = async (req, res) => {
    try {

        const user = await User.findById(req.user._id);

        const { name } = req.body;
        const avatar = req.files.avatar.tempFilePath;

        if (name) user.name = name;

        if (avatar) {
            const imageId = user.avatar.public_id;
            await cloudinary.v2.uploader.destroy(imageId);

            const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "Native APP",
            })

            fs.rmSync("./tmp", { recursive: true });

            user.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        await user.save()
        
        res.status(200).json({ success: true, message: "Profile updated successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};


// Update user password

export const updatePassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("+password");

        const { oldPassword, newPassword, confirmPassword } = req.body;

        const isPasswordMatched = await user.comparePassword(oldPassword);

        if (!isPasswordMatched) {
            return res.status(400).json({ success: false, message: "Old password not correct" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "password does not match" });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Forget password

export const forgetPassword = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // const { avatar } = req.files;

        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ success: false, message: "User already exists" })
        }

        const otp = Math.floor(Math.random() * 1000000)

        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpire = Date.now() * 10 * 60 * 1000;

        await user.save();

        const message = `Your password reseting Otp is ${otp} \n\n If you have not requested this email then, pls ignore it.`;

        await sendEmail({
            email: user.email,
            subject: "Request for Reseting Password",
            message
        });

        res.status(200).json({ success: true, message: `OTP sent to ${email}` });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}



//reset password

export const resetPassword = async (req, res, next) => {

    try {
        const { otp, newPassword, confirmPassword } = req.body;

        const user = await User.findOne({
            resetPasswordOtp: otp,
            resetPasswordOtpExpire: { $gt: Date.now() },
        }).select("+password");

        if (!user) {
            return res.status(400).json({ success: false, message: "Reset password OTP is Invalid or has been expired" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Password does not match" });
        }


        user.password = newPassword;
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpire = undefined;

        await user.save();
        res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};





// ADD TASK

export const addTask = async (req, res) => {
    try {
        const { title, description } = req.body;

        const user = await User.findById(req.user._id);

        user.tasks.push(
            {
                title,
                description,
                completed: false,
                createdAt: new Date(Date.now()),
            }
        );

        await user.save();
        res.status(200).json({ success: true, message: "Task added successfully." });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};
// DELETE TASK

export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const user = await User.findById(req.user._id);

        user.tasks = user.tasks.filter(t => t._id.toString() !== taskId.toString())

        await user.save();
        res.status(200).json({ success: true, message: "Task deleted successfully." });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};
// UPDATE TASK

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const user = await User.findById(req.user._id);

        user.task = user.tasks.find((task) => task._id.toString() === taskId.toString());

        user.task.completed = !user.task.completed;

        await user.save();
        res.status(200).json({ success: true, message: "Task updated successfully." });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};