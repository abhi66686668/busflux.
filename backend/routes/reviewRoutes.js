const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Submit a new review
// @access  Private
router.post('/', verifyToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        
        if (!rating || !comment) {
            return res.status(400).json({ error: 'Rating and comment are required' });
        }

        const newReview = new Review({
            user: req.user.id,
            rating,
            comment
        });

        await newReview.save();
        res.status(201).json({ message: 'Review submitted successfully', review: newReview });
    } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// @route   GET /api/reviews
// @desc    Get top/latest reviews for homepage
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Fetch up to 3 latest reviews with high ratings (4 or 5)
        const reviews = await Review.find({ rating: { $gte: 4 } })
                                    .populate('user', 'name userPhoto')
                                    .sort({ createdAt: -1 })
                                    .limit(3);
        res.json(reviews);
    } catch (error) {
        console.error('Fetch reviews error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

module.exports = router;
