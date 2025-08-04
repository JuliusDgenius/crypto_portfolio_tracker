# CSV Import/Export Functionality

This document describes the CSV import/export functionality implemented for the cryptocurrency portfolio tracker.

## Overview

The CSV functionality allows users to:
- Import transaction data from CSV files
- Export portfolio data to CSV files
- Export transaction history to CSV files
- Download CSV templates for proper formatting

## Backend Implementation

### Services

#### CsvService (`libs/portfolio/src/services/csv.service.ts`)

The main service handling CSV operations:

**Key Methods:**
- `importTransactions(portfolioId, fileBuffer, userId)` - Imports transactions from CSV
- `exportPortfolioData(options)` - Exports complete portfolio data
- `exportTransactions(portfolioId, startDate?, endDate?)` - Exports transaction history
- `getImportTemplate()` - Returns CSV template for import

**Features:**
- Batch processing for large files
- Data validation and error handling
- Support for date ranges
- Asset creation for new cryptocurrencies
- Transaction type validation

### Controllers

#### CsvController (`libs/portfolio/src/controllers/csv.controller.ts`)

REST API endpoints for CSV operations:

**Endpoints:**
- `POST /csv/import/:portfolioId` - Import transactions from CSV file
- `GET /csv/export/portfolio/:portfolioId` - Export portfolio data
- `GET /csv/export/transactions/:portfolioId` - Export transactions
- `GET /csv/template` - Download CSV template

**Features:**
- File upload handling with multer
- File type validation
- Proper HTTP headers for file downloads
- Query parameter support for filtering

### Data Models

**CSV Import Format:**
```csv
Date,Type,Cryptocurrency,Amount,Price Per Unit,Fee,Exchange,Wallet,Notes
2024-01-01T00:00:00.000Z,BUY,BTC,0.5,45000,25,Binance,My Wallet,Initial purchase
2024-01-15T00:00:00.000Z,SELL,BTC,0.1,48000,10,Binance,My Wallet,Partial sale
```

**Required Fields:**
- `Date` - ISO 8601 format
- `Type` - BUY, SELL, TRANSFER
- `Cryptocurrency` - Symbol (e.g., BTC, ETH)
- `Amount` - Numeric value
- `Price Per Unit` - Numeric value

**Optional Fields:**
- `Fee` - Transaction fee
- `Exchange` - Exchange name
- `Wallet` - Wallet address/name
- `Notes` - Additional notes

## Frontend Implementation

### API Service

#### csvService (`src/api/csv.ts`)

TypeScript service for CSV operations:

**Methods:**
- `importTransactions(portfolioId, file)` - Upload and import CSV
- `exportPortfolio(portfolioId, options)` - Export portfolio data
- `exportTransactions(portfolioId, startDate?, endDate?)` - Export transactions
- `downloadTemplate()` - Download CSV template

### Components

#### CsvImportDialog (`src/features/dashboard/components/CsvImportDialog.tsx`)

Modal dialog for CSV import:

**Features:**
- Drag and drop file upload
- File type validation
- Progress indication
- Error display with details
- Template download
- Success/error feedback

#### CsvExportDialog (`src/features/dashboard/components/CsvExportDialog.tsx`)

Modal dialog for CSV export:

**Features:**
- Export type selection (Portfolio/Transactions)
- Date range selection
- Include options (Assets/Transactions)
- Progress indication
- Automatic file download

#### CsvManagement (`src/features/dashboard/components/CsvManagement.tsx`)

Action buttons component:

**Features:**
- Import button with icon
- Export dropdown menu
- Integrated dialogs
- Consistent styling

### Integration

The CSV functionality is integrated into the main dashboard:

1. **PortfolioDashboard** - CSV management component added to action buttons
2. **Import Success** - Automatically refreshes portfolio data
3. **Error Handling** - User-friendly error messages
4. **Loading States** - Progress indicators during operations

## Usage Examples

### Importing Transactions

1. Click "Import CSV" button
2. Download template (optional)
3. Fill template with transaction data
4. Upload CSV file
5. Review import results
6. Portfolio automatically updates

### Exporting Data

1. Click "Export" button
2. Choose export type:
   - Portfolio Data (complete portfolio)
   - Transactions Only (transaction history)
3. Set date range (optional)
4. Choose what to include
5. Click "Export CSV"
6. File downloads automatically

## Error Handling

### Backend Errors
- File type validation
- Data format validation
- Database constraint errors
- User permission checks

### Frontend Errors
- Network errors
- File size limits
- Invalid file types
- Import validation errors

## Security Considerations

1. **File Upload Security**
   - File type validation
   - Size limits
   - Content scanning

2. **Data Validation**
   - Input sanitization
   - Type checking
   - Range validation

3. **User Permissions**
   - Portfolio ownership verification
   - JWT authentication required

## Performance Optimizations

1. **Batch Processing**
   - Large files processed in chunks
   - Database transactions for consistency

2. **Caching**
   - Template caching
   - Export result caching

3. **Async Operations**
   - Non-blocking file processing
   - Progress feedback

## Future Enhancements

1. **Advanced Features**
   - Bulk import from multiple files
   - Scheduled exports
   - Custom export formats

2. **Integration**
   - Exchange API integration
   - Wallet import/export
   - Tax reporting formats

3. **User Experience**
   - Drag and drop improvements
   - Real-time validation
   - Preview before import

## Testing

### Backend Tests
- Unit tests for CSV service
- Integration tests for endpoints
- File upload testing
- Data validation testing

### Frontend Tests
- Component unit tests
- User interaction testing
- File upload testing
- Error handling testing

## Dependencies

### Backend
- `csv-parser` - CSV parsing
- `csv-writer` - CSV generation
- `@types/multer` - File upload types

### Frontend
- `@mui/x-date-pickers` - Date selection
- `date-fns` - Date utilities

## API Documentation

### Import Transactions
```http
POST /api/csv/import/:portfolioId
Content-Type: multipart/form-data

file: CSV file
```

### Export Portfolio
```http
GET /api/csv/export/portfolio/:portfolioId?startDate=2024-01-01&endDate=2024-12-31&includeAssets=true&includeTransactions=true
```

### Export Transactions
```http
GET /api/csv/export/transactions/:portfolioId?startDate=2024-01-01&endDate=2024-12-31
```

### Download Template
```http
GET /api/csv/template
```

## Configuration

### File Upload Limits
- Maximum file size: 10MB
- Allowed file types: CSV only
- Maximum rows per import: 10,000

### Export Options
- Date range filtering
- Asset inclusion toggle
- Transaction inclusion toggle
- Custom filename generation 