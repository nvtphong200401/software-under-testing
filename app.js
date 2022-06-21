import express from 'express';
import viewMdware from './middleware/view.mdware.js';
import routesMdware from './middleware/routes.mdware.js';
import localMdware from "./middleware/locals.mdware.js";
import sessionMdware from "./middleware/session.mdware.js";
import flash from 'express-flash';


const app = express();

app.use(express.urlencoded({
    extended:true
}));
app.use(express.json());
app.use('/public', express.static('public'));
app.use(flash());
sessionMdware(app);
localMdware(app);
viewMdware(app);
routesMdware(app);

app.listen(process.env.PORT || 5000);