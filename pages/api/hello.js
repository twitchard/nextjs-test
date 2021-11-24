// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_KEY, {
  apiVersion: "2020-08-27",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const webhookHandler = async (req, res) => {
  console.log(Object.keys(process.env));
  if (req.method === "POST") {
    console.log("Endpoint Stripe Key: ", process.env.STRIPE_KEY);

    const buf = await buffer(req);

    const sig = req.headers["stripe-signature"];
    console.log("Signatures on endpoint: ", sig);
    if (!sig) return res.status(400).send("No 'stripe-signature' header");

    const webhookSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;
    if (!webhookSecret) {
      return res.status(400).send("No STRIPE_WEBHOOK_ENDPOINT_SECRET env var");
    }
    console.log("Signing Secret on endpoint: ", webhookSecret);

    let event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.log(`❌ Error message: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Success!!`);

    res.json({ received: true });
  } else {
    res.setHeader("Allow", "POST");

    res.status(405).end("Method Not Allowed");
  }
};

export default webhookHandler;
