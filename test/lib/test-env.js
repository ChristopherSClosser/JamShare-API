'use strict';

process.env.MONGODB_URI = 'mongodb://localhost/jamtesting';
process.env.PORT = 8080;
process.env.NODE_ENV = 'testing';
process.env.APP_SECRET = 'secret for tests';
process.env.AWS_ACCESS_KEY_ID = 'FAKEKEYFORAWS';
process.env.AWS_SECRET_ACCESS_KEY = 'FAKEACESSKEY';
process.env.AWS_BUCKET = 'jamshare-assets-testing';
