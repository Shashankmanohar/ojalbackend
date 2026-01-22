import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import connectDB from './Config/connectDB.js';
import adminRoute from './Routes/adminRoute.js';
import productRoutes from './Routes/productRoute.js';
import UserRoute from './Routes/userRoute.js'
import orderRoutes from './Routes/orderRoute.js';

const app = express();

// CORS configuration for frontend
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get("/", (req, res) => {
  res.send("Hello from backend");
});

app.use('/api/admin', adminRoute);
app.use('/api/products', productRoutes);
app.use('/api/users', UserRoute);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
