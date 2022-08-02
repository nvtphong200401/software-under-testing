import express from 'express';
import viewMdware from './middleware/view.mdware.js';
import routesMdware from './middleware/routes.mdware.js';
import localMdware from "./middleware/locals.mdware.js";
import sessionMdware from "./middleware/session.mdware.js";
import flash from 'express-flash';
import http from 'http';
import chai from 'chai';
const expect = chai.expect;
import request from 'supertest';
import { doesNotMatch } from 'assert';
import { exit } from 'process';
import productModel from './models/product.model.js';


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

const port = 3000;
// app.set('port', port);
// const server = http.createServer(app);
// server.listen(port);
const server = app.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`);
});
var Cookies;
describe('Our application', function() {

    it('should login', function (done) {
        request(app)
        .post('/auth')
        .set('Content-Type', 'application/json')
        .send({
            'username' : 'admin',
            'password' : 'admin123',
            'action' : 'Login'
        })
        .end((err, res) => {
            Cookies = res.headers['set-cookie'].pop().split(';')[0];
            done();
        })
    });

    it('should go to admin', function (done) {
        var req = request(app).get('/admin/product');
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
            done();
        })
    })

    // it('should delete product', async function() {
    //     var proBefore = await productModel.findAll();
    //     console.log(proBefore.length)
    //     var req = request(app).post(`/admin/product/del/${proBefore[0].ProID}`);
    //     req.cookies = Cookies;
    //     req.set('Accept','application/json')
    //     .end(async (err, res) => {
    //         var proAfter = await productModel.findAll();
    //         console.log(proAfter.length);

    //         expect(proBefore.length).to.equal(proAfter.length + 1);
    //         done();
    //         exit();
    //     })
    // })

    function checkWatchlistFalse(done) {
        var req = request(app).get('/watchlist/check/14');
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .end((err, res) => {
            expect(res.body).to.equal(false);
            done();
        })
    }
    function checkWatchlistTrue(done) {
        var req = request(app).get('/watchlist/check/14');
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .end((err, res) => {
            expect(res.body).to.equal(false);
            done();
        })
    }

    it('should not see in watchlist', checkWatchlistFalse);

    it('should add to watchlist', function(done) {
        var req = request(app).put('/watchlist/add');
        req.cookies = Cookies;
        req.set('Accept','application/json').send({id: 14})
        .end((err, res) => {
            done();
        })
    });

    it('should see in watchlist', checkWatchlistTrue);
    
    it('should delete in watchlist', function(done) {
        var req = request(app).put('/watchlist/del');
        req.cookies = Cookies;
        req.set('Accept','application/json').send({id: 14})
        .end((err, res) => {
            done();
        })
    });

    it('should not see in watchlist', checkWatchlistFalse);
    
    after(() => {
        server.close();
        
    })

});