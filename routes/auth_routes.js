import express, { request } from 'express';
import bcrypt from 'bcryptjs';
import moment from 'moment';
import userModel from '../models/users_model.js';
import verifyModel from '../models/verif.model.js';
import randToken from 'rand-token';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import passport from 'passport';
import fb from 'passport-facebook';
import gg from 'passport-google-oauth2';

const GoogleStrategy = gg.Strategy;
const FacebookStrategy = fb.Strategy;
const router = express.Router();
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});
router.use(passport.initialize());
router.use(passport.session());

//google config
passport.use(new GoogleStrategy({
  clientID:     '190176789225-196nq44iv4d0mvcp0ura99uam4u5d7ii.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: "http://localhost:3000/auth/google/login",
  passReqToCallback   : true
},
function(request, accessToken, refreshToken, profile, cb) {
  process.nextTick(() => {
    return cb(null, profile);
  });
}
));

//facebook config
passport.use(new FacebookStrategy({
  clientID: '636448247537390',
  clientSecret: '8e5b954aeb5e0c716b1edb0d3c6b9631',
  callbackURL: "http://localhost:3000/auth/facebook/login",
  profileFields: ['id', 'emails', 'name', 'birthday']
},
  async function (accessToken, refreshToken, profile, cb) {
    process.nextTick(() => {
      return cb(null, profile);
    });
  }
));
async function sendEmail(email, token, verify) {
  var email = email;
  var token = token;
  var mail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'dragonslayers248@gmail.com',
      pass: 'matkhauvip'
    }
  });
  var link;
  var purpose;
  if (verify) {
    link = "verify-email";
    purpose = "verify your email address";
  }
  else {
    link = "getNewPassword";
    purpose = "get new password"
  }
  var mailOptions = {
    from: 'dragonslayers248@gmail.com',
    to: email,
    subject: 'Email verification - onlineauction.com',
    html: '<p>Please use this <a href="http://localhost:3000/auth/' + link + '?token=' + token + '">link</a> ' + purpose + '</p>'

  };
  const info = await mail.sendMail(mailOptions);
  return 0;
}

router.post('/sendverify', async (req, res) => {
  const registered = await userModel.hasEmail(req.body.Email);
  if (registered.length > 0) {
    const token = await verifyModel.getVerification(req.body.Email);
    if (token.length > 0) {
      sendEmail(req.body.Email, token[0].token, true);
    } else {
      //Token has expired, generate new token for verification
      const newToken = randToken.generate(20);
      const verification = {
        email: req.body.Email,
        token: newToken,
      }
      await verifyModel.add(verification);
      sendEmail(req.body.Email, newToken, true);
    }
  }
  req.flash("success", "Please check verification in your email");
  res.redirect('/auth/');
})

router.post('/requestNewPassword', async (req, res) => {
  const registered = await userModel.hasEmail(req.body.Email);
  if (registered.length > 0) {
    const token = await verifyModel.getVerification(req.body.Email);
    if (token.length > 0) {
      sendEmail(req.body.Email, token[0].token, false);
    } else {
      //Token has expired, generate new token for new password
      const newToken = randToken.generate(20);
      const verification = {
        email: req.body.Email,
        token: newToken,
      }
      await verifyModel.add(verification);
      sendEmail(req.body.Email, newToken, false);
    }
  }
  req.flash("success", "Please check new password in your email");
  res.redirect('/auth/');
})
router.get('/getNewPassword', async (req, res) => {
  const token = req.query.token;
  if (token === undefined) res.redirect('/auth/');

  const result = await verifyModel.verify_email(req.query.token);
  if (result.length > 0) {
    await verifyModel.removeToken(result[0].email)
    //create new token
    const newToken = randToken.generate(20);
      const verification = {
        email: req.body.Email,
        token: newToken,
      }
      await verifyModel.add(verification);
    return res.render('auth/forgot', {
      token: newToken,
      layout: 'auth'
    });
  }
  res.redirect('/auth/')
})
router.post('/getNewPassword', async (req, res) => {
  const token = req.body.token;
  const rs = await verifyModel.verify_email(token);
  const email = rs[0].email;

  const rawPassword = req.body.Password;
  const salt = bcrypt.genSaltSync(10);
  const newPassword = bcrypt.hashSync(rawPassword, salt);
  await userModel.setNewPassword(email, newPassword);
  verifyModel.removeToken(email);
  req.flash("success", "Please use new password to continue");
  res.redirect('/auth/')
})
router.get('/verify-email', async (req, res) => {
  var type = 'success';
  var msg = 'Your email has been verified';
  const result = await verifyModel.verify_email(req.query.token);

  if (result.length > 0) {
    await userModel.setVerified(result[0].email);
    await verifyModel.removeToken(result[0].email);
  } else {
    type = 'warning';
    msg = 'Unknown request';
  }
  req.flash(type, msg);
  return res.redirect('/auth/');
})

router.get('/', (req, res) => {
  if (req.session.auth) {
    return res.redirect('/');
  }
  res.render('auth/login', { layout: 'auth' })
})

router.post('/', async (req, res) => {
  const form = req.body;
  if (form.action === 'Register') {
    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
      return res.json({ "success": false, 'msg': "Please select captcha" });
    }
    const secretKey = '6LeQeVkdAAAAAII17USsJckBlpj_4KW6ZntKEo_q';
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body['g-recaptcha-response']}`;
    const captchaVerified = await fetch(verifyUrl, {
      method: 'POST'
    })
    if (captchaVerified === false) return res.json({ "success": false, 'msg': "Failed to verified" });
    const rawPassword = form.password;
    const salt = bcrypt.genSaltSync(10);
    const Password = bcrypt.hashSync(rawPassword, salt);
    const DOB = moment(form.dob, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const Fullname = form.fullname;
    const Email = form.email;
    const Username = form.username;
    const ID = await userModel.findLastUserID(); 
    const user = {
      ID: +ID + 1,
      Username,
      Fullname,
      Password,
      DOB,
      Email
    };
    const u = await userModel.findByEmail(Email);
    if (u.length > 0) {
      if (u[0].isBanned === 1) {
        var type = 'warning';
        var msg = 'You has been banned before ! Please contact admin to solve the problem !';
        req.flash(type, msg);
        return res.redirect('/auth/');
      }
    }
    const token = randToken.generate(20);
    const verification = {
      email: Email,
      token: token,
    }

    await userModel.add(user);
    await verifyModel.add(verification);
    const sent = await sendEmail(Email, token, true);
    var type = 'success';
    var msg = 'Email already verified';
    if (sent === 0) {
      type = 'success';
      msg = 'The verification link has been sent to your email address';
    } else {
      type = 'success';
      msg = 'Something goes wrong';
    }
    req.flash(type, msg);
    return res.redirect('/auth/');
  }
  //Login
  else if (form.action === 'Login') {
    const user = await userModel.findByUsername(req.body.username);
    if (user === null) {
      return res.render('auth/login', {
        layout: 'auth',
        err_message: 'Invalid username or password.'
      });
    }
    // Check banned user
    if (user.isBanned === 1) {
      return res.render('auth/login', {
        layout: 'auth',
        err_message: 'Your account has been banned, please contact admin to solve the problem'
      });
    }
    //Check verified account
    const verify = await userModel.checkVerified(req.body.username);
    if (verify[0].Verified === 0) {
      return res.render('auth/login', {
        err_message: 'Your email has not been verified.',
        re_verify: true,
        layout: 'auth'
      })
    }

    const ret = bcrypt.compareSync(req.body.password, user.Password);
    if (ret === false) {
      return res.render('auth/login', {
        err_message: 'Invalid username or password.',
        layout: 'auth'
      })
    }
    delete user.Password;

    req.session.auth = true;
    req.session.authUser = user;
    const url = req.session.retUrl || '/';
    res.redirect(url);
  }
});

router.get('/facebook', passport.authenticate('facebook', {scope: ['email', 'user_birthday']}));
router.get('/google', passport.authenticate('google', { scope: [ 'email', 'profile' ] }));

router.get('/google/login', passport.authenticate('google', { failureRedirect: '/auth/' }),
  async (req, res) => {
    var user = {};
    const ID = await userModel.findLastUserID(); 
    user.ID =  +ID + 1;
    user.FullName = req.user.displayName;
    user.DOB = '12/4/1999';
    user.Email = req.user.email;
    user.Verified = 1;
    const li = user.FullName.split(' ');
    user.Username = li[li.length - 1];
    var rs = await userModel.findByEmail(user.Email);
    if (rs.length === 0) {
      await userModel.add(user);
      rs = await userModel.findByEmail(user.Email);
    }
    user = rs[0];
    if (user.isBanned === 1) {
      return res.render('auth/login', {
        layout: 'auth',
        err_message: 'Your account has been banned, please contact admin to solve the problem'
      });
    }
    req.session.auth = true;
    req.session.authUser = user;
    const url = req.session.retUrl || '/';
    return res.redirect(url);
  // Successful authentication, redirect home.
});


router.get('/facebook/login', passport.authenticate('facebook', { failureRedirect: '/auth/' }),
async (req, res) => {
  var user = {};
  const u = req.user._json;
  const ID = await userModel.findLastUserID(); 
  var rs = await userModel.findByEmail(u.email);
  if (rs.length === 0) {
    user.ID =  +ID + 1;
    user.Username = u.first_name;
    user.FullName = u.last_name + " "+ u.middle_name +" "+ u.first_name;
    user.DOB = moment(u.birthday).format('YYYY-MM-DD') ;
    user.Email = u.email;
    user.Verified = 1;
    await userModel.add(user);
    rs = await userModel.findByEmail(u.email);
    user = rs[0];
  }
  user = rs[0];
  if (user.isBanned === 1) {
    return res.render('auth/login', {
      layout: 'auth',
      err_message: 'Your account has been banned, please contact admin to solve the problem'
    });
  }
  req.session.auth = true;
  req.session.authUser = user;
  const url = req.session.retUrl || '/';
  return res.redirect(url);
  // Successful authentication, redirect home.
});

router.get('/is-available', async function (req, res) {
  const username = req.query.user;
  if (username !== undefined) {
    const user = await userModel.findByUsername(username);
    if (user !== null) {
      return res.json(false);
    }
  }
  const email = req.query.email;
  if (email !== undefined) {
    const e = await userModel.findByEmail(email);
    if (e.length > 0) {
      return res.json(false);
    }
  }

  return res.json(true);
});

router.post('/logout', async function (req, res) {
  req.session.auth = false;
  req.session.authUser = null;
  req.session.cart = [];

  const url = req.headers.referer || '/';
  res.redirect(url);
});


export default router;