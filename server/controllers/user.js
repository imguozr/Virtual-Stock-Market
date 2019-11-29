const User = require('../models/User');
const rp = require('request-promise');
const createToken = require('../middlewares/createToken');
const checkToken = require('../middlewares/checkToken');
const OAuthConfig = require('../../config/auth.config')
const url = require('../middlewares/url');

const Register = async (ctx) => {
    let result = {
        success: false,
        message: '',
        data: null
    };

    let post = ctx.request.body;
    await User.findOne({
        name: post.name
    }).then(user => {
        if (user) {
            result.message = 'Registered before!';
            ctx.body = result;
            return false;
        }
    }).catch(err => {
        ctx.body = err;
    });

    let userResult = await User.create({
        name: post.name,
        password: post.password,
        email: post.email,
        address: post.address,
        token: createToken(post.name)
    });
    if (userResult) {
        result.success = true;
        result.message = 'Registered successfully';
        result.data = {
            name: post.name,
            email: post.email
        };
    }
    ctx.body = result;
};

const Login = async (ctx) => {
    let result = {
        success: false,
        message: '',
        data: null
    };
    let post = ctx.request.body;
    await User.findOne({
        name: post.name
    }).then(user => {
        if (!user) {
            result.message = 'No such user';
            ctx.body = result;
            return false;
        } else if (post.password === user.password) {
            result.success = true;
            result.message = 'Login Successfully!';
            result.data = {
                name: user.name,
                token: createToken(user.name)
            };
        } else {
            result.message = 'Wrong Password';
        }
    }).catch(err => {
        ctx.body = err;
    });
    ctx.body = result;
};

const LogOut = async (ctx) => {
    let result = {
        success: false,
        message: '',
        data: null
    }
    let post = ctx.request.body;
    await User.findOne({
        name: post.name
    }).then(async (user) => {
        if (!user) {
            result.message = 'No such user.'
            ctx.body = result;
            return false;
        } else {
            user.token = null;
            await user.save();
        }
    }).catch(err => {
        ctx.body = err;
    });
    ctx.body = result;
};

const GetToken = async (ctx) => {
    ctx.body = ctx.token;
};

const GetGithub = async (ctx) => {
    let dataStr = (new Date()).valueOf();
    // redirect to auth api
    // https://github.com/login/oauth/authorize?client_id=xxxxx&state=xxx&redirect_uri=xxxx
    let path = 'https://github.com/login/oauth/authorize';
    path += '?client_id=' + OAuthConfig.GITHUB_CLIENT_ID;
    path += '&state=' + dataStr;
    ctx.body = path;
};

const GetGithubUser = async (ctx, token) => {
    let result = {
        success: false,
        data: null
    };
    var path = 'https://api.github.com/user';
    var opts = {
        uri: path,
        qs: {
            access_token: ctx.query.token // -> uri + '?access_token=xxxxx%20xxxxx'
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true
    };
    await rp.get(opts).then(res => {
        result.data = res;
        result.success = true;
    }).catch(err => {
        ctx.body = err;
        return false;
    })
    ctx.body = result;
};

const GetGithubAccessToken = async (ctx, next) => {
    var code = ctx.request.query.code;
    var path = 'https://github.com/login/oauth/access_token';

    path += '?client_id=' + OAuthConfig.GITHUB_CLIENT_ID;
    path += '&client_secret=' + OAuthConfig.GITHUB_CLIENT_SECRET;
    path += '&code=' + code;
    let accessToken = '';
    await rp.post(path).then(body => {
        // console.log('body', body)
        let obj = url.getSearch(body);
        accessToken = obj.access_token;
    })
    ctx.redirect(`http://localhost:8080/#/github?access_token=${accessToken}`);
};

module.exports = (router) => {
    router.post('/register', Register),
        router.post('/login', Login),
        router.post('/logout', LogOut),
        router.get('/getToken', checkToken, GetToken),
        router.get('/auth/github', GetGithub),
        router.get('/auth/github/callback', GetGithubAccessToken),
        router.get('/auth/github/user', GetGithubUser)
}

