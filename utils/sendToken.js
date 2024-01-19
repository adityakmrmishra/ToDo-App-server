// CREATING TOKEN AND SAVING IN COOKIE
export const sendToken = (res, user, statusCode, message) => {
    const token = user.getJWTToken();

    //Option for cookie
    const options = {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };

    const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        tasks: user.tasks,
        verified: user.verified,
    }

    res.
        status(statusCode).
        cookie("token", token, options).
        json({
            message,
            success: true,
            user: userData,
        });

};

