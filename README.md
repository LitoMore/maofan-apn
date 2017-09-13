# maofan-apn

[![](https://badges.greenkeeper.io/LitoMore/maofan-apn.svg)](https://greenkeeper.io/)
[![](https://img.shields.io/travis/LitoMore/maofan-apn/master.svg)](https://travis-ci.org/LitoMore/maofan-apn)
[![](https://raw.github.com/LitoMore/badges/master/badges/maofan.svg?sanitize=true)](https://itunes.apple.com/us/app/%E7%8C%AB%E9%A5%AD/id1071730189)
[![](https://img.shields.io/github/license/LitoMore/maofan-apn.svg)](https://github.com/LitoMore/maofan-apn/blob/master/LICENSE)
[![](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

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

## Maintainers

- [LitoMore](https://github.com/LitoMore)
- [mogita](https://github.com/mogita)

## License

MIT © [LitoMore](https://github.com/LitoMore)
