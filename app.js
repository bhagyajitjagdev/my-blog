require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
const cors = require('cors');

const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const app = express();

app.set('view engine', 'ejs');

app.use(express.static(__dirname));
app.use(cookieParser());

const oneDay = 1000 * 60 * 60 * 24;
app.use(
  sessions({
    secret: 'thisismysecrctekeynamanagarwal',
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const bcrypt = require('bcryptjs/dist/bcrypt');
const jwt = require('jsonwebtoken');
const Validator = require('validatorjs');
const db = require('./SQL/database/mysql');
const path = require('path');

const home = async (req, res) => {
  const posts = await db.Post.findAll({
    include: [
      {
        model: db.User,
        required: true,
      },
    ],
    order: [['_id', 'desc']],
  });

  res.render(path.join(__dirname, './views/home'), {
    user: req.session.user,
    posts: posts,
  });
};

app.get('/', (req, res) => {
  home(req, res);
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    home(req, res);
  } else {
    res.render(path.join(__dirname, './views/login'), {
      user: req.session.user,
    });
  }
});

app.get('/add-post', (req, res) => {
  if (req.session.user) {
    res.render(path.join(__dirname, './views/Post'), {
      user: req.session.user,
    });
  } else {
    res.render(path.join(__dirname, './views/login'), {
      user: req.session.user,
    });
  }
});

app.get('/register', (req, res) => {
  if (req.session.user) {
    home(req, res);
  } else {
    res.render(path.join(__dirname, './views/register'), {
      user: req.session.user,
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.user = null;
  home(req, res);
});

const auth = (req, res, next) => {
  try {
    const token = req.session.user.TOKEN;
    console.log('🚀 ~ file: app.js ~ line 74 ~ auth ~ token', token);
    jwt.verify(token, process.env.SECRET);

    req.payload = jwt.verify(token, process.env.SECRET);
    next();
  } catch (error) {
    return res.render(path.join(__dirname, './views/login'), {
      message: 'Please Login',
      user: req.session.user,
    });
  }
};

app.post('/api/register', async (req, res, next) => {
  try {
    const rules = {
      firstName: 'required',
      lastName: 'required',
      email: 'required',
      password: 'required',
      mobile: 'required',
    };

    const validation = new Validator(req.body, rules);

    if (!validation.passes()) {
      return res.render(path.join(__dirname, './views/message'), {
        message: 'Bad Request',
        user: req.session.user,
      });
    }

    req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));

    const [createdUser, isCreated] = await db.User.findOne({
      where: {
        [db.Op.or]: {
          email: req.body.email || '',
          mobile: req.body.mobile || '',
        },
      },
    }).then(async (data) => {
      if (data) {
        return [null, 0];
      }
      const user = await db.User.create(req.body);

      return [user, 1];
    });

    if (isCreated)
      return res.render(path.join(__dirname, './views/login'), {
        user: req.session.user,
      });

    return res.render(path.join(__dirname, './views/message'), {
      message: 'User Already Exists',
      user: req.session.user,
    });
  } catch (err) {
    return res.render(path.join(__dirname, './views/message'), {
      message: 'Error',
      user: req.session.user,
    });
  }
});

app.post('/api/login', async (req, res, next) => {
  try {
    const rules = {
      email: 'required',
      password: 'required',
    };

    const validation = new Validator(req.body, rules);

    if (!validation.passes()) {
      return res.render(path.join(__dirname, './views/message'), {
        message: 'Bad Request',
        user: req.session.user,
      });
    }

    const userData = await db.User.findOne({
      where: {
        [db.Op.or]: {
          email: req.body.email || '',
          mobile: req.body.mobile || '',
        },
        isDeleted: {
          [db.Op.eq]: false,
        },
      },
    }).then(async (user) => {
      if (!user) return 1;

      const isValid = await bcrypt.compare(req.body.password, user.password);

      if (!isValid) return 2;

      const TOKEN = jwt.sign(
        {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
        },
        process.env.SECRET,
        {
          expiresIn: '48h',
        }
      );

      return { user, TOKEN };
    });

    if (userData === 1 || userData === 2) {
      return res.render(path.join(__dirname, './views/message'), {
        message: 'Bad Request',
        user: req.session.user,
      });
    }
    req.session.user = JSON.parse(JSON.stringify(userData));
    return home(req, res);
  } catch (err) {
    return res.render(path.join(__dirname, './views/message'), {
      message: 'Error',
      user: req.session.user,
    });
  }
});

app.post('/api/add-post', auth, async (req, res, next) => {
  try {
    const rules = {
      content: 'required',
    };

    const validation = new Validator(req.body, rules);

    if (!validation.passes()) {
      return res.render(path.join(__dirname, './views/message'), {
        message: 'Bad Request',
        user: req.session.user,
      });
    }

    const post = await db.Post.create({ ...req.body, createdBy: req.payload._id });

    return home(req, res);
  } catch (error) {
    return res.render(path.join(__dirname, './views/message'), {
      message: 'Error',
      user: req.session.user,
    });
  }
});

module.exports = app;
