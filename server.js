import {app} from './app.js';
import {config} from "dotenv";
import { connectDatabase } from './config/database.js';
import cloudinary from 'cloudinary';

config({
    path:"./config/config.env"
})


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
});

connectDatabase();

app.listen(process.env.PORT, () => {
    console.log(`Server is working on http://localhost:${process.env.PORT}`);
});