juliusdgenius@juliusdgenius:~/JuliusDgenius/crypto_portfolio_tracker$ tree -I "node_modules"
.
├── apps
│   └── api
│       ├── nest-cli.json
│       ├── package.json
│       ├── package-lock.json
│       ├── README.md
│       ├── src
│       │   ├── app.module.ts
│       │   ├── health
│       │   │   ├── health.controller.ts
│       │   │   └── health.module.ts
│       │   └── main.ts
│       ├── test
│       │   ├── app.e2e-spec.ts
│       │   ├── database-test.module.ts
│       │   ├── health.e2e-spec.ts
│       │   └── jest-e2e.json
│       └── tsconfig.json
├── dist
│   └── apps
│       └── api
│           ├── main.1d7a2ce5c96dba06f336.hot-update.js
│           ├── main.1d7a2ce5c96dba06f336.hot-update.json
│           ├── main.js
│           └── templates
│               ├── account-deletion.hbs
│               ├── alerts
│               │   └── alert-price.hbs
│               ├── email-verification.hbs
│               ├── layout.hbs
│               ├── password-changed.hbs
│               ├── password-reset.hbs
│               ├── security-alert.hbs
│               └── two-factor-setup.hbs
├── docker-compose.yml
├── Dockerfile.dev
├── docs
│   ├── api-endpoints.md
│   ├── data-models.md
│   ├── frontend-architecture.md
│   ├── implementation-guide.md
│   ├── implementation-plan.md
│   └── project-file-structure.md
├── jest.config.ts
├── libs
│   ├── alerts
│   │   ├── src
│   │   │   ├── alerts.module.ts
│   │   │   ├── alert.validator.ts
│   │   │   ├── controllers
│   │   │   │   ├── index.ts
│   │   │   │   └── price-alert.controller.ts
│   │   │   ├── dto
│   │   │   │   ├── alert-response.dto.ts
│   │   │   │   ├── create-price-alert.dto.ts
│   │   │   │   ├── get-price-alert.dto.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── notification-preferences.dto.ts
│   │   │   │   └── update-alert.dto.ts
│   │   │   ├── helpers
│   │   │   │   └── template.helpers.ts
│   │   │   ├── index.ts
│   │   │   ├── interfaces
│   │   │   │   ├── alert-conditions.interface.ts
│   │   │   │   ├── alert-notification.interface.ts
│   │   │   │   └── index.ts
│   │   │   ├── processors
│   │   │   │   ├── index.ts
│   │   │   │   ├── portfolio-alert.processor.ts
│   │   │   │   ├── price-alert.processor.ts
│   │   │   │   └── system-alert.processor.ts
│   │   │   ├── services
│   │   │   │   ├── alert.mapper.ts
│   │   │   │   ├── alert-notification.service.ts
│   │   │   │   ├── alert-processor.service.ts
│   │   │   │   ├── alert.service.ts
│   │   │   │   └── index.ts
│   │   │   ├── templates
│   │   │   │   └── alert-price.hbs
│   │   │   └── types
│   │   │       ├── alert.type.ts
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   ├── auth
│   │   ├── src
│   │   │   ├── auth.module.ts
│   │   │   ├── controllers
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── index.ts
│   │   │   ├── decorators
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   └── index.ts
│   │   │   ├── dto
│   │   │   │   ├── index.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── reset-password.dto.ts
│   │   │   │   └── verify-email.dto.ts
│   │   │   ├── guards
│   │   │   │   ├── index.ts
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── jwt-refresh.guard.ts
│   │   │   ├── index.ts
│   │   │   ├── interfaces
│   │   │   │   ├── index.ts
│   │   │   │   ├── jwt-payload.interface.ts
│   │   │   │   └── tokens.interface.ts
│   │   │   ├── services
│   │   │   │   └── auth.service.ts
│   │   │   └── strategies
│   │   │       ├── index.ts
│   │   │       ├── jwt-refresh.strategy.ts
│   │   │       ├── jwt-secrets.ts
│   │   │       └── jwt.strategy.ts
│   │   └── tsconfig.json
│   ├── common
│   │   ├── src
│   │   │   ├── common.module.ts
│   │   │   ├── decorators
│   │   │   │   ├── api-version.decorator.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── public.decorator.ts
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   └── user.decorator.ts
│   │   │   ├── dto
│   │   │   ├── email
│   │   │   │   ├── config
│   │   │   │   │   ├── email.config.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── email.module.ts
│   │   │   │   ├── email.service.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── templates
│   │   │   │   │   ├── account-deletion.hbs
│   │   │   │   │   ├── email-verification.hbs
│   │   │   │   │   ├── layout.hbs
│   │   │   │   │   ├── password-changed.hbs
│   │   │   │   │   ├── password-reset.hbs
│   │   │   │   │   ├── security-alert.hbs
│   │   │   │   │   └── two-factor-setup.hbs
│   │   │   │   └── welcome-email.hbs
│   │   │   ├── exceptions
│   │   │   │   ├── base.exception.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── refresh-token.exceptions.ts
│   │   │   ├── filters
│   │   │   │   ├── all-exceptions.filter.ts
│   │   │   │   ├── http-exception.filter.ts
│   │   │   │   └── index.ts
│   │   │   ├── guards
│   │   │   │   ├── api-key.guard.ts
│   │   │   │   ├── auth
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── refresh-token.guard.ts
│   │   │   │   ├── authorization
│   │   │   │   │   └── roles.guard.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── security
│   │   │   │   │   ├── throttler.guard.ts
│   │   │   │   │   └── websocket.guard.ts
│   │   │   │   └── validation-guards
│   │   │   │       ├── index.ts
│   │   │   │       └── validate-user.guard.ts
│   │   │   ├── index.ts
│   │   │   ├── interceptors
│   │   │   │   ├── index.ts
│   │   │   │   ├── logging.interceptor.ts
│   │   │   │   └── transform.interceptor.ts
│   │   │   ├── interfaces
│   │   │   │   ├── email-config.interface.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── user.interface.ts
│   │   │   ├── logging
│   │   │   │   ├── constants.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── interfaces
│   │   │   │   │   └── logger.interface.ts
│   │   │   │   ├── logger.service.ts
│   │   │   │   ├── logging.module.ts
│   │   │   │   ├── middleware
│   │   │   │   │   └── logging.middleware.ts
│   │   │   │   └── winston-config.service.ts
│   │   │   └── pipes
│   │   │       ├── index.ts
│   │   │       ├── parse-id.pipe.ts
│   │   │       └── validation.pipe.ts
│   │   └── tsconfig.json
│   ├── config
│   │   ├── src
│   │   │   ├── config.module.ts
│   │   │   ├── config.service.ts
│   │   │   ├── env.validation.ts
│   │   │   ├── index.ts
│   │   │   └── swagger.config.ts
│   │   └── tsconfig.json
│   ├── core
│   │   ├── src
│   │   │   ├── base
│   │   │   │   └── base.entity.ts
│   │   │   ├── constants
│   │   │   │   └── index.ts
│   │   │   ├── core.module.ts
│   │   │   ├── core.service.ts
│   │   │   ├── dto
│   │   │   │   ├── base.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── entities
│   │   │   │   ├── crypto-asset.entity.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── user.entity.ts
│   │   │   ├── exchange-account
│   │   │   │   ├── dto
│   │   │   │   │   ├── create-exchange-account.dto.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── exchange-account.controller.ts
│   │   │   │   ├── exchange-account.service.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── types
│   │   │   │       ├── exchange.types.ts
│   │   │   │       └── index.ts
│   │   │   ├── index.ts
│   │   │   ├── interfaces
│   │   │   │   ├── base.interface.d.ts
│   │   │   │   ├── base.interface.js
│   │   │   │   ├── base.interface.js.map
│   │   │   │   ├── base.interface.ts
│   │   │   │   ├── crypto.interface.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── repository.interface.d.ts
│   │   │   │   ├── repository.interface.js
│   │   │   │   ├── repository.interface.js.map
│   │   │   │   ├── repository.interface.ts
│   │   │   │   └── response.interface.ts
│   │   │   ├── types
│   │   │   │   ├── common.types.ts
│   │   │   │   ├── crypto-types.ts
│   │   │   │   └── index.ts
│   │   │   └── user
│   │   │       ├── dto
│   │   │       │   ├── create-user.dto.ts
│   │   │       │   ├── index.ts
│   │   │       │   └── update-user.dto.ts
│   │   │       ├── interfaces
│   │   │       │   ├── index.ts
│   │   │       │   └── token.interface.ts
│   │   │       ├── repositories
│   │   │       │   ├── index.ts
│   │   │       │   └── user.repository.ts
│   │   │       ├── services
│   │   │       │   ├── index.ts
│   │   │       │   └── password.service.ts
│   │   │       └── user.module.ts
│   │   └── tsconfig.json
│   ├── crypto
│   │   ├── src
│   │   │   ├── controllers
│   │   │   │   ├── index.ts
│   │   │   │   ├── market.controller.ts
│   │   │   │   ├── price.controller.ts
│   │   │   │   └── websocket.controller.ts
│   │   │   ├── crypto.module.ts
│   │   │   ├── dto
│   │   │   │   ├── get-asset-info.dto.ts
│   │   │   │   ├── get-prices.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   ├── interfaces
│   │   │   │   ├── crypto-price.interface.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── market-data.interface.ts
│   │   │   │   ├── market.interface.ts
│   │   │   │   └── price-response.interface.ts
│   │   │   ├── jobs
│   │   │   │   └── price-update.job.ts
│   │   │   └── services
│   │   │       ├── crypto.service.ts
│   │   │       ├── exchange-rate.service.ts
│   │   │       ├── index.ts
│   │   │       ├── market.service.ts
│   │   │       ├── price.service.ts
│   │   │       └── websocket.service.ts
│   │   └── tsconfig.json
│   ├── database
│   │   ├── src
│   │   │   ├── database.module.ts
│   │   │   ├── health.service.ts
│   │   │   ├── index.ts
│   │   │   ├── interfaces
│   │   │   │   ├── connection.interface.ts
│   │   │   │   ├── database-error.interface.ts
│   │   │   │   ├── database-operation.interface.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── models
│   │   │   │   │   ├── alert.interface.ts
│   │   │   │   │   ├── asset.interface.ts
│   │   │   │   │   ├── exchange-account.interface.ts
│   │   │   │   │   ├── historical-data.interface.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── portfolio.interface.ts
│   │   │   │   │   ├── transaction.interface.ts
│   │   │   │   │   ├── user.interface.ts
│   │   │   │   │   └── watchlist.interface.ts
│   │   │   │   └── retry-options.interface.ts
│   │   │   ├── prisma.service.ts
│   │   │   └── redis
│   │   │       ├── index.ts
│   │   │       ├── interfaces
│   │   │       │   ├── index.ts
│   │   │       │   └── redis-options.interface.ts
│   │   │       ├── redis.constants.ts
│   │   │       ├── redis.module.ts
│   │   │       └── redis.service.ts
│   │   └── tsconfig.json
│   ├── portfolio
│   │   ├── src
│   │   │   ├── controllers
│   │   │   │   ├── historical-data.controller.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── portfolio.controller.ts
│   │   │   │   └── transaction.controller.ts
│   │   │   ├── dto
│   │   │   │   ├── create-asset.dto.ts
│   │   │   │   ├── create-historical-data.dto.ts
│   │   │   │   ├── create-portfolio.dto.ts
│   │   │   │   ├── create-transaction.dto.ts
│   │   │   │   ├── get-historical-data.dto.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── update-asset.dto.ts
│   │   │   │   ├── update-portfolio.dto.ts
│   │   │   │   └── update-transaction.dto.ts
│   │   │   ├── index.ts
│   │   │   ├── interfaces
│   │   │   │   ├── asset-snapshot.interface.ts
│   │   │   │   ├── historical-data-point.interface.ts
│   │   │   │   └── index.ts
│   │   │   ├── jobs
│   │   │   │   ├── historical-data-updates.job.ts
│   │   │   │   └── index.ts
│   │   │   ├── portfolio.module.ts
│   │   │   ├── services
│   │   │   │   ├── analytics.service.ts
│   │   │   │   ├── historial.service.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── portfolio.service.ts
│   │   │   │   └── transaction.service.ts
│   │   │   ├── types
│   │   │   │   ├── index.ts
│   │   │   │   └── portfolio.types.ts
│   │   │   └── utils
│   │   └── tsconfig.json
│   └── watchlist
│       ├── src
│       │   ├── controllers
│       │   │   ├── index.ts
│       │   │   └── watchlist.controller.ts
│       │   ├── dto
│       │   │   ├── add-asset.dto.ts
│       │   │   ├── create-watchlist.dto.ts
│       │   │   ├── index.ts
│       │   │   └── update-watchlist.dto.ts
│       │   ├── index.ts
│       │   ├── services
│       │   │   ├── index.ts
│       │   │   ├── watchlist-alert.service.ts
│       │   │   └── watchlist.service.ts
│       │   ├── types
│       │   │   ├── index.ts
│       │   │   └── watchlist.types.ts
│       │   └── watchlist.module.ts
│       └── tsconfig.json
├── nest-cli.json
├── package.json
├── package-lock.json
├── prisma
│   └── schema.prisma
├── README.md
├── tsconfig.base.json
├── tsconfig.build.json
├── tsconfig.json
└── webpack.config.js

98 directories, 283 files