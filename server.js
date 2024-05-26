require("dotenv").config();
const stripe = require('stripe')( process.env.NODE_STRIPE_SECRET_KEY );
const express = require('express');
const cors = require('cors')
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('dist'));
app.use(cors({
  origin: "*",
}))

app.use((req, res, next) => {
  console.log('Received request:', req.method, req.url);
  next();
});

const YOUR_DOMAIN = 'http://localhost:5173/';


app.post('/create-checkout-session', async (req, res) => {

  const params = {
    submit_type: 'pay',
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    customer_email: req.body.user?.email,
    phone_number_collection: {
      "enabled": true
    },
    line_items: req.body.cartItems.map((item) => {
      const img = item.image[0].asset._ref;
      const newImage = img.replace('image_', 'https://cdn.sanity.io/images/segsyn0k/production/').replace('-webp', '.webp');

      return {
        price_data: {
          currency: 'LKR',
          product_data: {
            name: item.name,
            images: [newImage],
          },
          unit_amount: item.price * 100,
        },
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
        },
        quantity: item.quantity,
      };
    }),
    mode: 'payment',
    success_url: `${YOUR_DOMAIN}payment-success`,
    cancel_url: `${YOUR_DOMAIN}cart`,
  };

  try {
    const session = await stripe.checkout.sessions.create(params);
    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 4242;

app.listen(port, () => console.log('Running on port ', port));