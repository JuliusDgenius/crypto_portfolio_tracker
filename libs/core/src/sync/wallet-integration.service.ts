import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WalletIntegrationService {
  private readonly logger = new Logger(WalletIntegrationService.name);

  async fetchBtcBalance(address: string) {
    try {
      // Blockstream API
      const url = `https://blockstream.info/api/address/${address}`;
      const { data } = await axios.get(url);
      // data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum = balance (in sats)
      const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 1e8;
      // Fetch transactions
      const txsUrl = `https://blockstream.info/api/address/${address}/txs`;
      const { data: txs } = await axios.get(txsUrl);
      return { balance, transactions: txs };
    } catch (error) {
      this.logger.error('BTC fetch error', error);
      throw error;
    }
  }

  async fetchEthBalance(address: string) {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    try {
      // ETH balance
      const url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
      const { data } = await axios.get(url);
      const balance = parseFloat(data.result) / 1e18;

      // ERC-20 tokens
      const tokenUrl = `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc&apikey=${apiKey}`;
      const { data: tokenData } = await axios.get(tokenUrl);
      // Parse tokenData.result for token transfers

      // Transactions
      const txUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
      const { data: txData } = await axios.get(txUrl);

      return {
        balance,
        tokens: tokenData.result, // You may want to normalize this
        transactions: txData.result,
      };
    } catch (error) {
      this.logger.error('ETH fetch error', error);
      throw error;
    }
  }

  async fetchEvmBalance(address: string, chain: string) {
    // Map chain to API base and key
    const apiMap = {
      polygon: {
        base: 'https://api.polygonscan.com/api',
        key: process.env.POLYGONSCAN_API_KEY,
      },
      bsc: {
        base: 'https://api.bscscan.com/api',
        key: process.env.BSCSCAN_API_KEY,
      },
      // Add more as needed
    };
    const api = apiMap[chain];
    if (!api) throw new Error('Unsupported chain');
    try {
      const url = `${api.base}?module=account&action=balance&address=${address}&tag=latest&apikey=${api.key}`;
      const { data } = await axios.get(url);
      const balance = parseFloat(data.result) / 1e18;
      // ...repeat for tokens and transactions as above
      return { balance, tokens: [], transactions: [] };
    } catch (error) {
      this.logger.error(`${chain} fetch error`, error);
      throw error;
    }
  }
} 