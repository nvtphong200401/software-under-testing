import express from 'express';

import cartModel from '../models/cart.model.js';
import productModel from '../models/product.model.js';

const router = express.Router();

router.get('/', async function (req, res) {
    if (typeof (req.session.auth) === 'undefined') {
        req.session.auth = false;
    }
    if (req.session.auth === false) {
        res.redirect('/auth');
    } else {
        const items = [];
        for (const cartElement of req.session.cart) {
            const product = await productModel.findById(cartElement.id);
            items.push(product[0]);
        }

        res.render('vwBidder/watchlist', {
            layout: 'main',
            items: items,
            empty: items.length === 0
        });
    }

});

router.get('/check/:id', function (req, res) {
    const id = req.params.id || 0;

    if (cartModel.isInCart(req.session.cart, +id)) {
        return res.json(true);
    }
    return res.json(false);
});

router.put('/add', async function (req, res) {
    const item = {
        id: +req.body.id
    }
    cartModel.add(req.session.cart, item);
    res.redirect(req.headers.referer);
});

router.put('/del', async function (req, res) {
    cartModel.del(req.session.cart, +req.body.id);
    res.redirect(req.headers.referer);
});

export default router;