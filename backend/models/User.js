
const mongoose =
  require("mongoose");



const userSchema =
  new mongoose.Schema(

    {

      // NAME
      name: {

        type: String,

        default: ""

      },



      // EMAIL
      email: {

        type: String,

        required: true,

        unique: true,

        default: ""

      },



      // PASSWORD
      password: {

        type: String,

        default: ""

      },



      // PHONE NUMBER
      phone: {

        type: String,

        default: ""

      },



      // GENDER
      gender: {
        type: String,
        default: ""
      },

      // AGE
      age: {

        type: Number,

        default: 0

      },



      // AGE GROUP
      ageGroup: {

        type: String,

        default: ""

      },



      // AADHAAR NUMBER
      aadhaarNumber: {

        type: String,

        default: ""

      },



      // COLLEGE ID
      collegeId: {
        type: String,
        default: ""
      },

      // STARTING YEAR
      startingYear: {
        type: Number,
        default: null
      },
      
      // ENDING YEAR
      endingYear: {
        type: Number,
        default: null
      },

      // INSTITUTION TYPE
      institutionType: {
        type: String,
        default: ""
      },
      
      // CERTIFICATE PHOTO
      certificatePhoto: {
        type: String,
        default: ""
      },

      // PROFILE PHOTO
      userPhoto: {

        type: String,

        default: ""

      },



      // ID CARD PHOTO
      idCardPhoto: {

        type: String,

        default: ""

      },



      // EMAIL OTP
      otp: {

        type: String,

        default: ""

      },



      // EMAIL VERIFIED
      isVerified: {

        type: Boolean,

        default: false

      },



      // RESET PASSWORD OTP
      resetOtp: {

        type: String,

        default: ""

      },



      // USER ROLE
      role: {

        type: String,

        default: "user"

      },



      // WALLET BALANCE
      balance: {
        type: Number,
        default: 0
      },

      // MONTHLY PASS
      monthlyPassBalance: {
        type: Number,
        default: 0
      },
      monthlyPassExpiry: {
        type: Date,
        default: null
      },

      // CONDUCTOR EXPERIENCE (IN YEARS)
      experience: {
        type: Number,
        default: 0
      },

      // LAST UPI ID USED
      lastUpiIdUsed: {
        type: String,
        default: ""
      },

      // BANK DETAILS
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      upiId: { type: String, default: "" },

      createdAt: {
        type: Date,
        default: Date.now
      }
    },

    {

      timestamps: true

    }

  );



module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);
