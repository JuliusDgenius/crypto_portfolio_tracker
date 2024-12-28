import { ApiProperty } from "@nestjs/swagger";

export interface IMarketData {
  symbol: string;
  name: string;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  rank: number;
  lastUpdated: Date;
}

export class MarketDataResponse {
  @ApiProperty({ example: 'btc', description: 'Cryptocurrency symbol' })
  symbol: string;

  @ApiProperty({ example: 'Bitcoin', description: 'Cryptocurrency name' })
  name: string;

  @ApiProperty({ example: 850000000000, description: 'Market capitalization in USD' })
  marketCap: number;

  @ApiProperty({ example: 28000000000, description: '24-hour trading volume in USD' })
  volume24h: number;

  @ApiProperty({ example: 19000000, description: 'Current circulating supply' })
  circulatingSupply: number;

  @ApiProperty({ example: 21000000, description: 'Maximum supply of the cryptocurrency' })
  totalSupply: number;

  @ApiProperty({ example: 1, description: 'Market cap rank' })
  rank: number;

  @ApiProperty({ example: '2024-12-28T16:06:26.415Z', description: 'Last update timestamp' })
  lastUpdated: Date;
}

export class MarketSearchResultItem {
  @ApiProperty({ example: 'BTC', description: 'Cryptocurrency symbol' })
  symbol: string;

  @ApiProperty({ example: 'Bitcoin', description: 'Cryptocurrency name' })
  name: string;

  @ApiProperty({ example: 42000.50, description: 'Current price in USD' })
  price: number;

  @ApiProperty({ example: 850000000000, description: 'Market capitalization in USD' })
  marketCap: number;
}

export class MarketSearchResponse {
  @ApiProperty({
    type: [MarketSearchResultItem],
    description: 'Array of search results',
    example: [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 42000.50,
        marketCap: 850000000000
      },
      {
        symbol: 'BCH',
        name: 'Bitcoin Cash',
        price: 225.75,
        marketCap: 4400000000
      }
    ]
  })
  results: MarketSearchResultItem[];
}

export class MarketTrendingResultItem {
  @ApiProperty({ example: 'BTC', description: 'Cryptocurrency symbol' })
  symbol: string;

  @ApiProperty({ example: 'Bitcoin', description: 'Cryptocurrency name' })
  name: string;

  @ApiProperty({ example: 42000.50, description: 'Current price in USD' })
  price: number;

  @ApiProperty({ example: 2.5, description: '24-hour price change percentage' })
  change24h: number;
}

export class MarketTrendingResponse {
  @ApiProperty({
    type: [MarketTrendingResultItem],
    description: 'Array of trending cryptocurrencies',
    example: [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 42000.50,
        change24h: 2.5
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 2250.75,
        change24h: 3.2
      }
    ]
  })
  trending: MarketTrendingResultItem[];
}