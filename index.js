import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "my-verify-token-0001111"; // any secret string you choose
const WHATSAPP_TOKEN = "YOUR_ACCESS_TOKEN"; // from Meta Developer Console
const PHONE_NUMBER_ID = "YOUR_PHONE_NUMBER_ID"; // from Meta Developer Console

// 1️⃣ Webhook verification (called by Meta)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2️⃣ Handle incoming messages
app.post("/webhook", async (req, res) => {
  const data = req.body;

  // Check if there is a message
  const messages =
    data.entry?.[0]?.changes?.[0]?.value?.messages;

  if (messages && messages.length > 0) {
    const msg = messages[0];
    const from = msg.from; // user's phone number
    const text = msg.text?.body?.toLowerCase();

    console.log(`Message from ${from}: ${text}`);

    // If user says "hi", send list menu
    if (text === "hi") {
      try {
        await axios.post(
          `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: "whatsapp",
            to: from,
            type: "interactive",
            interactive: {
              type: "list",
              header: {
                type: "text",
                text: "Main Menu"
              },
              body: {
                text: "Please choose an option:"
              },
              footer: {
                text: "Powered by WhatsApp API"
              },
              action: {
                button: "View Options",
                sections: [
                  {
                    title: "Services",
                    rows: [
                      {
                        id: "option1",
                        title: "📦 Order Status",
                        description: "Check your latest order"
                      },
                      {
                        id: "option2",
                        title: "🛒 New Order",
                        description: "Place a new order"
                      }
                    ]
                  },
                  {
                    title: "Help",
                    rows: [
                      {
                        id: "option3",
                        title: "💬 Talk to Support",
                        description: "Chat with a representative"
                      }
                    ]
                  }
                ]
              }
            }
          },
          {
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );
        console.log("Menu sent!");
      } catch (err) {
        console.error("Error sending menu:", err.response?.data || err.message);
      }
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("Webhook running on port 3000"));
