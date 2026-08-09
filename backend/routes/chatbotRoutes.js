const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const userMessage = (req.body.message || '').toLowerCase();
        // Since no specific number was provided, using a placeholder
        const customerServiceNumber = '1800-BUS-HELP'; 
        
        let reply = `I'm sorry, I didn't quite catch that. Could you rephrase your question or contact our customer support at ${customerServiceNumber}?`;

        // Recharge and Wallet Support
        if (userMessage.match(/recharge failed|money deducted|balance not updated|failed recharge|refund status/i)) {
            reply = `If your recharge failed or money was deducted without updating your balance, please wait up to 24 hours for the bank to process the refund. You can check your recharge history in the Wallet section. For urgent issues, please call customer service at ${customerServiceNumber}.`;
        } else if (userMessage.match(/recharge history|history/i)) {
            reply = "You can view your recharge history by going to your Wallet page and scrolling down to the 'History' section.";
        } else if (userMessage.match(/add money|how to recharge|step by step|steps/i)) {
            reply = `Here is a step-by-step guide to recharge your wallet:<br>
            <ol style="margin-top: 10px; margin-bottom: 10px; padding-left: 20px;">
                <li>Go to the <b>Wallet</b> tab in the navigation menu.<br><img src="step1_wallet.png?v=3" class="chat-img-thumb" style="width:150px; border-radius:10px; margin-top:5px; margin-bottom:10px; border: 1px solid #e2e8f0; cursor:pointer;" alt="Step 1"></li>
                <li>Enter the amount you wish to add and click the purple <b>Top Up</b> button.<br><img src="step2_amount.png?v=2" class="chat-img-thumb" style="width:150px; border-radius:10px; margin-top:5px; margin-bottom:10px; border: 1px solid #e2e8f0; cursor:pointer;" alt="Step 2"></li>
                <li>Select your preferred payment method on the secure checkout screen.<br><img src="step3_success.png?v=3" class="chat-img-thumb" style="width:150px; border-radius:10px; margin-top:5px; border: 1px solid #e2e8f0; cursor:pointer;" alt="Step 3"></li>
                <li>Once the payment is completed, you will see a success confirmation and your balance will update instantly!<br><img src="step4_success.png?v=1" class="chat-img-thumb" style="width:150px; border-radius:10px; margin-top:5px; border: 1px solid #e2e8f0; cursor:pointer;" alt="Step 4"></li>
            </ol>
            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 15px;">(Click any image to view full size)</div>
            <div style="margin-top: 10px;">
                <strong>Or watch this quick video tutorial:</strong><br>
                <video width="100%" controls style="border-radius:10px; margin-top:5px; border: 1px solid #e2e8f0;">
                    <source src="paymenttutorial.mp4.mp4" type="video/mp4">
                    Your browser does not support HTML video.
                </video>
            </div>`;
        }
        
        // Bus Related Questions
        else if (userMessage.match(/konaje to mangalore/i)) {
            reply = "Buses from Konaje to Mangalore run frequently. The next available bus is expected in about 10 minutes. Please check the 'Track Bus' section for live updates.";
        } else if (userMessage.match(/natekal/i)) {
            reply = "Buses on Route 51 and select express routes go to Natekal. You can use the search bar to find exact timings.";
        } else if (userMessage.match(/sharada bus/i)) {
            reply = "Yes, Sharada Travels buses are currently operating on their scheduled routes. You can view their timings in the 'Buses' tab.";
        } else if (userMessage.match(/thokkottu to state bank/i)) {
            reply = "The standard bus fare from Thokkottu to State Bank is ₹15. Express or AC buses might charge slightly more.";
        }
        else if (userMessage.match(/next bus|when is the|timings/i)) {
            reply = "To find the next bus and timings, please use the search feature on our homepage by entering your starting point and destination.";
        } else if (userMessage.match(/which bus goes to|available|route/i)) {
            reply = "You can view all available buses and their routes on the 'Buses' page or by searching for your destination on the home screen.";
        } else if (userMessage.match(/fare|price/i)) {
            reply = "Fares depend on the distance. Please enter your 'From' and 'To' locations in the search bar to see the exact fare for your journey.";
        }

        // Password Issues
        else if (userMessage.match(/forgot password|reset.*password|cannot login|can't login|password/i) && !userMessage.match(/change.*password|update.*password/i)) {
            reply = `Here is a step-by-step guide to reset your password:<br>
            <ol style="margin-top: 10px; margin-bottom: 10px; padding-left: 20px;">
                <li>Go to the Login screen and click the <b>'Forgot Password?'</b> link.<br><img src="forgot_step1.png?v=1" class="chat-img-thumb" style="width:150px; border-radius:10px; margin-top:5px; margin-bottom:10px; border: 1px solid #e2e8f0; cursor:pointer;" alt="Step 1"></li>
                <li>Enter your registered email address and click the <b>'Send Reset Link'</b> button.<br><img src="forgot_step2.png?v=1" class="chat-img-thumb" style="width:150px; border-radius:10px; margin-top:5px; margin-bottom:10px; border: 1px solid #e2e8f0; cursor:pointer;" alt="Step 2"></li>
                <li>Check your email for the link, set your new password, and you will see a success confirmation.<br><img src="forgot_step3.png?v=1" class="chat-img-thumb" style="width:150px; border-radius:10px; margin-top:5px; border: 1px solid #e2e8f0; cursor:pointer;" alt="Step 3"></li>
            </ol>
            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 15px;">(Click any image to view full size)</div>
            <div style="margin-top: 10px;">
                <strong>Having trouble?</strong> Contact our support team for assistance.
            </div>`;
        } else if (userMessage.match(/change.*password|update.*password/i)) {
            reply = "You can change your password by logging into your account, going to your Profile, and selecting the 'Change Password' option.";
        }

        // Booking Help
        else if (userMessage.match(/how to book/i)) {
            reply = "To book a ticket, go to the 'Search' page, enter your route, select a bus, and click 'Book'. The amount will be deducted from your wallet balance.";
        } else if (userMessage.match(/cancel booking/i)) {
            reply = "You can cancel your booking from the 'My Bookings' section. Please note that cancellation charges may apply according to our refund policy.";
        } else if (userMessage.match(/download ticket/i)) {
            reply = "You can download your ticket or view the QR code in the 'My Bookings' section of your profile.";
        } else if (userMessage.match(/qr.*not working/i)) {
            reply = "If your QR ticket is not working, try increasing your screen brightness or ask the conductor to enter your Ticket ID manually.";
        } else if (userMessage.match(/refund policy/i)) {
            reply = "Our refund policy allows a full refund if the bus is cancelled by the operator. For user cancellations, standard deductions apply based on the time of cancellation.";
        }

        // Complaint Registration
        else if (userMessage.match(/complaint|driver|misconduct|delay|wrong fare|conductor issue/i)) {
            reply = `We apologize for the inconvenience. Please register your complaint by emailing us at support@busflux.com or call our customer service hotline at ${customerServiceNumber}. Please provide your ticket ID and details of the issue.`;
        }

        // Customer Service
        else if (userMessage.match(/customer service|support|help|contact/i)) {
            reply = `You can reach our customer service team at ${customerServiceNumber} or email us at support@busflux.com.`;
        }

        // Greetings
        else if (userMessage.match(/^hi|^hello|^hey/i)) {
            reply = "Hello! I am the BusFlux support bot. How can I assist you today? You can ask me about wallet recharges, bus timings, password resets, bookings, or register a complaint.";
        }

        // Simulate a slight typing delay for realism
        setTimeout(() => {
            res.json({ reply });
        }, 600);
        
    } catch (error) {
        console.error("Chatbot error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

router.post('/assist', async (req, res) => {
    try {
        const { subject, details } = req.body;
        
        let context = '';
        if (subject) context += `Subject: ${subject}\n`;
        if (details) context += `Details: ${details}\n`;

        if (!context) {
            return res.status(400).json({ error: "No input provided" });
        }

        // Mocking a powerful AI response for the demo
        let expandedText = `I am writing to report an issue regarding "${subject || 'a recent problem'}". \n\n${details ? `Specifically, ${details}. ` : ''}\nThis has caused a significant inconvenience, and I would appreciate it if the support team could look into this matter as soon as possible and provide a resolution. Thank you.`;
        
        // Simulate AI generation delay
        setTimeout(() => {
            res.json({ expandedText });
        }, 1200);

    } catch (error) {
        console.error("AI Assist error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

module.exports = router;
