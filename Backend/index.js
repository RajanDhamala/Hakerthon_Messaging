import app from './app.js';
import dotenv  from 'dotenv';
import connectDb from './src/Database/ConnectDb.js';
import { connectRedis } from './src/Utils/ConnectRedis.js';
dotenv.config();

const startServer = async () => {
  try {

    await connectDb();
    // await connectRedis();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1); // Exit with failure
  }
};

startServer();