export const templateHelpers = {
  formatPrice: (price: number | null | undefined): string => {
    console.log('Price value received in helper:', price);
    console.log('Type of price:', typeof price);

    if (price < 0) {
      return 'Price cannot be negative';
    }

    // Check if price is null, undefined, or NaN
    if (price === null || price === undefined || Number.isNaN(price)) {
      console.log('Price validation failed - null/undefined/NaN check');
      return 'Price unavailable';
    }
  
    // Ensure we're working with a number
    const numericPrice = Number(price);
    console.log('Price after Number conversion:', numericPrice);
    
    // Double-check if the conversion resulted in a valid number
    if (Number.isNaN(numericPrice)) {
      console.log('Price validation failed - numeric conversion check');
      return 'Price unavailable';
    }
  
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericPrice);
  },
  
    formatDate: (date: Date): string => {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
      }).format(new Date(date));
    },
  
    toLowerCase: (str: string): string => str.toLowerCase(),
  };