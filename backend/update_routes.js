const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Bus = require("./models/Bus");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB.");

    const goldenStops = [
      "Montepadavu",
      "Kallukatta",
      "Natekal",
      "Kannachur",
      "Deralakatte",
      "K.S. Hegde Hospital",
      "Kuthar Junction",
      "Babbukatte",
      "Thokkottu",
      "Mugeru",
      "Pumpwell",
      "Kankanady",
      "Jyothi",
      "Balmatta",
      "State Bank"
    ];

    const silverStops = [...goldenStops].reverse();

    const updatedGolden = await Bus.findOneAndUpdate(
      { busName: /GOLDEN/i },
      {
        from: goldenStops[0],
        to: goldenStops[goldenStops.length - 1],
        stops: goldenStops
      },
      { new: true }
    );

    const updatedSilver = await Bus.findOneAndUpdate(
      { busName: /SILVER/i },
      {
        busName: "SILVER",
        busNumber: "KA 19 9999",
        price: 25,
        from: silverStops[0],
        to: silverStops[silverStops.length - 1],
        stops: silverStops,
        isActive: true
      },
      { new: true, upsert: true }
    );

    console.log("Updated GOLDEN:", updatedGolden ? "Success" : "Not Found");
    console.log("Updated SILVER:", updatedSilver ? "Success" : "Not Found");

    mongoose.connection.close();
  })
  .catch(err => console.error("MongoDB Connection Error:", err));
