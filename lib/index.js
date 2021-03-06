'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _passportOauth = require('passport-oauth');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * `Strategy` constructor.
 * The Windows Live authentication strategy authenticates requests by delegating to Windows Live using OAuth2 access tokens.
 * Applications must supply a `verify` callback which accepts a accessToken, refreshToken, profile and callback.
 * Callback supplying a `user`, which should be set to `false` if the credentials are not valid.
 * If an exception occurs, `error` should be set.
 *
 * Options:
 * - clientID          Identifies client to Windows Live App
 * - clientSecret      Secret used to establish ownership of the consumer key
 * - passReqToCallback If need, pass req to verify callback
 *
 * @param {Object} _options
 * @param {Function} _verify
 * @example
 * passport.use(new WindowsLiveTokenStrategy({
 *   clientID: '123456789',
 *   clientSecret: 'shhh-its-a-secret'
 * }), function(accessToken, refreshToken, profile, next) {
 *   User.findOrCreate({windowsId: profile.id}, function(error, user) {
 *     next(error, user);
 *   })
 * });
 */

var WindowsLiveTokenStrategy = function (_OAuth2Strategy) {
  _inherits(WindowsLiveTokenStrategy, _OAuth2Strategy);

  function WindowsLiveTokenStrategy(_options, _verify) {
    _classCallCheck(this, WindowsLiveTokenStrategy);

    var options = _options || {};
    var verify = _verify;

    options.authorizationURL = options.authorizationURL || 'https://login.live.com/oauth20_authorize.srf';
    options.tokenURL = options.tokenURL || 'https://login.live.com/oauth20_token.srf';

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WindowsLiveTokenStrategy).call(this, options, verify));

    _this.name = 'windowslive-token';
    _this._accessTokenField = options.accessTokenField || 'access_token';
    _this._refreshTokenField = options.refreshTokenField || 'refresh_token';
    _this._profileURL = options.profileURL || 'https://apis.live.net/v5.0/me';
    _this._passReqToCallback = options.passReqToCallback;
    return _this;
  }

  /**
   * Authenticate method
   * @param {Object} req
   * @param {Object} options
   * @returns {*}
   */

  _createClass(WindowsLiveTokenStrategy, [{
    key: 'authenticate',
    value: function authenticate(req, options) {
      var _this2 = this;

      var accessToken = (req.body && req.body[this._accessTokenField]) || (req.query && req.query[this._accessTokenField]) || (req.headers && req.headers[this._accessTokenField]);
      var refreshToken = (req.body && req.body[this._refreshTokenField]) || (req.query && req.query[this._refreshTokenField]) || (req.headers && req.headers[this._refreshTokenField]);

      if (!accessToken) return this.fail({ message: 'You should provide ' + this._accessTokenField });

      this._loadUserProfile(accessToken, function (error, profile) {
        if (error) return _this2.error(error);

        var verified = function verified(error, user, info) {
          if (error) return _this2.error(error);
          if (!user) return _this2.fail(info);

          return _this2.success(user, info);
        };

        if (_this2._passReqToCallback) {
          _this2._verify(req, accessToken, refreshToken, profile, verified);
        } else {
          _this2._verify(accessToken, refreshToken, profile, verified);
        }
      });
    }

    /**
     * Parse user profile
     * @param {String} accessToken Windows Live OAuth2 access token
     * @param {Function} done
     */

  }, {
    key: 'userProfile',
    value: function userProfile(accessToken, done) {
      this._oauth2.get(this._profileURL, accessToken, function (error, body, res) {
        if (error) {
          try {
            var errorJSON = JSON.parse(error.data);
            return done(new _passportOauth.InternalOAuthError(errorJSON.error.message, errorJSON.error.code));
          } catch (_) {
            return done(new _passportOauth.InternalOAuthError('Failed to fetch user profile', error));
          }
        }

        try {
          var json = JSON.parse(body);
          var profile = {
            provider: 'windowslive',
            id: json.id,
            username: json.username || '',
            displayName: json.name || '',
            name: {
              familyName: json.last_name || '',
              givenName: json.first_name || ''
            },
            emails: [],
            photos: [{
              value: 'https://apis.live.net/v5.0/' + json.id + '/picture'
            }],
            _raw: body,
            _json: json
          };

          if (json.emails && json.emails.account) profile.emails.push({ value: json.emails.account, type: 'account' });
          if (json.emails && json.emails.personal) profile.emails.push({ value: json.emails.personal, type: 'home' });
          if (json.emails && json.emails.business) profile.emails.push({ value: json.emails.business, type: 'work' });
          if (json.emails && json.emails.other) profile.emails.push({ value: json.emails.other, type: 'other' });

          if (json.emails && json.emails.preferred) {
            for (var i = 0; i < profile.emails.length; i++) {
              if (profile.emails[i].value == json.emails.preferred) {
                profile.emails[i].primary = true;
              }
            }
          }

          return done(null, profile);
        } catch (e) {
          return done(e);
        }
      });
    }
  }]);

  return WindowsLiveTokenStrategy;
}(_passportOauth.OAuth2Strategy);

exports.default = WindowsLiveTokenStrategy;
module.exports = exports['default'];