const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bus = require('../models/Bus');

router.get('/', async (req, res) => {
    try {
        const usersCount = await User.countDocuments();
        const busesCount = await Bus.countDocuments();
        const uniqueRoutes = await Bus.aggregate([
            { $group: { _id: { from: "$from", to: "$to" } } }
        ]);
        const routesCount = uniqueRoutes.length;

        res.json({
            usersCount: usersCount > 0 ? usersCount : 0,
            busesCount: busesCount > 0 ? busesCount : 0,
            routesCount: routesCount > 0 ? routesCount : 0,
            onTimeGuarantee: '99.9%', // keeping it as a high static value
            averageRating: 4.8
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
