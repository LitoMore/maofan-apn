# maofan-apn

APN service for Maofan

## API

### POST /notifier/on

**Request parameters**

| Name | Description |
| :-: | :-- |
| device_token | Device token from app as a string |
| oauth_token | Fanfou OAuth token |
| oauth_token_secret | Fanfou OAuth token secret |

### POST /notifier/off

**Request parameters**

| Name | Description |
| :-: | :-- |
| device_token | Device token from app as a string |
| oauth_token | Fanfou OAuth token |
| oauth_token_secret | Fanfou OAuth token secret |

### GET /notifier/check

**Request parameters**

| Name | Description |
| :-: | :-- |
| device_token | Device token from app as a string |
| oauth_token | Fanfou OAuth token |

## Related

- [fanfou-streamer](https://github.com/LitoMore/fanfou-streamer) - Fanfou Streaming SDK for Node.js

## License

MIT © [LitoMore](https://github.com/LitoMore)
