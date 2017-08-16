# maofan-apn

APN service for Maofan

## API

### POST /notifier/on

Turn on streamer

#### Parameters

- `device_token`
- `oauth_token`
- `oauth_token_secret`

#### Response

`on` or `invalid`

### POST /notifier/off

Turn off streamer

#### Parameters

- `device_token`
- `oauth_token`

#### Response

`off` or `invalid`

### GET /notifier/check

Check streamer status

#### Parameters

- `device_token`
- `oauth_token`

#### Response

`on`, `off` or `invalid`

## License

MIT © [LitoMore](https://github.com/LitoMore)
