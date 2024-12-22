"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreService = void 0;
const common_1 = require("@nestjs/common");
const base_exception_1 = require("./exceptions/base.exception");
let CoreService = class CoreService {
    validateCryptoSymbol(symbol) {
        if (!symbol || !/^[A-Z0-9]{2,10}$/.test(symbol)) {
            throw new base_exception_1.BaseException('Invalid cryptocurrency symbol', 'INVALID_SYMBOL', 400);
        }
        return true;
    }
    formatCurrencyAmount(amount, decimals = 2) {
        return amount.toFixed(decimals);
    }
    calculatePercentageChange(currentValue, previousValue) {
        if (previousValue === 0)
            return 0;
        return ((currentValue - previousValue) / previousValue) * 100;
    }
    validateDateRange(startDate, endDate) {
        if (startDate > endDate) {
            throw new base_exception_1.BaseException('Invalid date range', 'INVALID_DATE_RANGE', 400);
        }
        return true;
    }
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new base_exception_1.BaseException('Invalid email format', 'INVALID_EMAIL', 400);
        }
        return true;
    }
    sanitizeInput(input) {
        return input.trim().replace(/[<>]/g, '');
    }
    calculatePortfolioValue(holdings, prices) {
        return holdings.reduce((total, holding) => {
            const price = prices.get(holding.assetId) || 0;
            return total + (holding.quantity * price);
        }, 0);
    }
    calculateAveragePrice(transactions) {
        const total = transactions.reduce((acc, tx) => ({
            totalQuantity: acc.totalQuantity + tx.quantity,
            totalValue: acc.totalValue + (tx.quantity * tx.price),
        }), { totalQuantity: 0, totalValue: 0 });
        return total.totalQuantity > 0 ? total.totalValue / total.totalQuantity : 0;
    }
    validateTransactionAmount(amount, balance) {
        if (amount <= 0) {
            throw new base_exception_1.BaseException('Invalid transaction amount', 'INVALID_AMOUNT', 400);
        }
        if (amount > balance) {
            throw new base_exception_1.BaseException('Insufficient balance', 'INSUFFICIENT_BALANCE', 400);
        }
        return true;
    }
    calculateRealizedPnL(buyPrice, sellPrice, quantity) {
        return (sellPrice - buyPrice) * quantity;
    }
};
exports.CoreService = CoreService;
exports.CoreService = CoreService = __decorate([
    (0, common_1.Injectable)()
], CoreService);
//# sourceMappingURL=core.service.js.map