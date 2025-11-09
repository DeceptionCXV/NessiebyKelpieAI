export const parseWebsites = (input: string): string[] => {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

export const validateWebsites = (websites: string[]): { valid: boolean; error?: string } => {
  if (websites.length === 0) {
    return { valid: false, error: 'Please enter at least one website' };
  }

  if (websites.length > 25) {
    return { valid: false, error: 'Maximum 25 websites allowed' };
  }

  const urlPattern = /^https?:\/\/.+/i;
  const invalidUrls = websites.filter(url => !urlPattern.test(url));

  if (invalidUrls.length > 0) {
    return {
      valid: false,
      error: `Invalid URL format: ${invalidUrls[0]}. Please include http:// or https://`
    };
  }

  return { valid: true };
};
