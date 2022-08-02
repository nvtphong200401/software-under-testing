import express from 'express';
import viewMdware from './middleware/view.mdware.js';
import routesMdware from './middleware/routes.mdware.js';
import localMdware from "./middleware/locals.mdware.js";
import sessionMdware from "./middleware/session.mdware.js";
import flash from 'express-flash';
import chai from 'chai';
const expect = chai.expect;
import supertest from 'supertest';
import { exit } from 'process';
import  request  from 'request';
import cheerio from 'cheerio';


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
describe('Our application', function() {

    it('should see home page', function(done) {
      supertest(app).get('/').expect(200).end((err, res) => done())
    });

    it('should see 404', function(done) {
        supertest(app)
        .get('/asd')
        .expect(404)
        .end((err, res) => done())
    })
    it('admin should be redirect', function(done) {
        supertest(app)
        .get('/admin/product')
        .expect(302)
        .end((err, res) => {
            expect(res.header.location).to.equal('/auth/');
            done()
        })
    })
    it('seller should be redirect', function(done) {
        supertest(app)
        .get('/seller/')
        .expect(302)
        .end((err, res) => {
            expect(res.header.location).to.equal('/auth/');
            done();
        })
    })

    it('should search', function(done){
        request({
            method: 'GET',
            url: 'http://localhost:3000/search?q=thoi+trang'
        }, (err, res, body) => {
            
            if (err) return console.error(err);
        
            let $ = cheerio.load(body);
        
            expect($('a.text-dark').text().includes('Phong dz')).to.equal(true);
            done();
        });
    });

    after(() => {
        server.close();
    })
});