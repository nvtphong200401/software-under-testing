import guestRoute from "../routes/guest.routes.js";
import authRoute from '../routes/auth_routes.js';
import adminRoute from '../routes/admin_routes.js';
import productRoute from '../routes/product.routes.js';
import bidderRoute from '../routes/bidder.routes.js';
import sellerRoute from '../routes/seller.routes.js';
import cartRoute from '../routes/cart.route.js'
import auth from './auth.mdware.js';

export default function (app) {
    //use your route here

    // guestRoot
    app.use('/', guestRoute);

    app.use('/bidder',auth, bidderRoute);

    app.use('/watchlist', cartRoute);

    app.use('/product', productRoute);
    
    app.use('/auth', authRoute);

    app.use('/admin', auth, adminRoute);

    app.use('/seller',auth, sellerRoute);
    // 404 and 500 pages
    app.use(function (req, res, next) {
        res.status(404).render('404', { layout: false });
    });

    app.use(function (err, req, res, next) {
        console.error(err.stack)
        res.status(500).render('500', { layout: false });
    });
}
