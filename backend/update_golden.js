const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Bus = require("./models/Bus");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB.");

    const newStops = ['Natekal', 'Deralakatte', 'Kuthar', 'Thokkottu', 'State Bank'];

    const updatedBus = await Bus.findOneAndUpdate(
      { busName: /GOLDEN/i }, // find GOLDEN bus
      {
        from: newStops[0],
        to: newStops[newStops.length - 1],
        stops: newStops
      },
      { new: true }
    );

    if (updatedBus) {
      console.log("Updated GOLDEN bus successfully:");
      console.log(updatedBus);
    } else {
      console.log("GOLDEN bus not found!");
    }

    mongoose.connection.close();
  })
  .catch(err => console.error("MongoDB Connection Error:", err));
