const express = require('express');
const bodyPaser = require('body-parser');
const session = require('express-session');
const massive = require('massive');
const axios = require('axios');

require('dotenv').config();
console.log(process.env.CONNECTION_STRING)
massive(process.env.CONNECTION_STRING).then(db => app.set('db', db));

const app = express();
app.use(bodyPaser.json());
app.use(session({
  secret: "mega hyper ultra secret",
  saveUninitialized: false,
  resave: false,
}));

function checkLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
}

app.get('/secure-data', checkLoggedIn, (req, res) => {
  res.json({ someSecureData: 123 });
});

app.post('/login', (req,res) => {
  const auth0Url = 'https://' + process.env.REACT_APP_AUTH0_DOMAIN + '/tokeninfo';
  const {idToken} = req.body;
  axios.post(auth0Url, {id_token: idToken}).then(response => {
    console.log('response', response);
    app.get('db').find_user_by_auth0_id(response.data.user_id).then(users => {
      if (users.length) {
        req.session.user = users[0];
        res.json({user:users[0]});
      } else {
        app.get('db').create_user(response.data.user_id, response.data.email).then(users => {
          req.session.user = users[0];
          res.json({user: users[0]});
        }).catch((err) => {console.log('err', err)})
      }
    }).catch((err) => {console.log('err', err)})
  })
});


const PORT = 3030;
app.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});
