hello.init({

    strava: {
        name: 'strava',
        oauth: {
            version: 2,
            auth: 'https://www.strava.com/oauth/authorize',
            grant: 'https://www.strava.com/oauth/token',
            response_type: 'code',
        },
        scope: {
            public: 'public',
            email: 'public',
        },
        base: 'https://www.strava.com/api/v3',

        // jsonp: false
    }
});
